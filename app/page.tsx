"use client";

import { useEffect, useRef, useState } from "react";
import DishEditor from "@/components/DishEditor";
import EstimateCard from "@/components/EstimateCard";
import Logo from "@/components/Logo";
import MealRanking from "@/components/MealRanking";
import NutritionFacts from "@/components/NutritionFacts";
import Onboarding from "@/components/Onboarding";
import Saathi from "@/components/Saathi";
import SpikeBadge from "@/components/SpikeBadge";
import TodayCard from "@/components/TodayCard";
import WeekCard from "@/components/WeekCard";
import { estimateSpike, nutritionFor, type Estimate } from "@/lib/estimate";
import { afterMealNote, introMessages, readingWarning } from "@/lib/guide";
import {
  REMINDER_AFTER_MS,
  findWaitingMeal,
  formatSpike,
  loadMeals,
  mealsOn,
  parseReading,
  rankBySpike,
  saveMeals,
  spike,
  type Dish,
  type Meal,
} from "@/lib/meals";
import {
  MEAL_LABELS,
  formatTime,
  loadProfile,
  mealTypeAt,
  saveProfile,
  type MealType,
  type Profile,
} from "@/lib/profile";
import { resizeImage } from "@/lib/resizeImage";

// Logging a meal moves through these stages:
// before → photo → confirm → estimate → waiting → result
type Stage = "before" | "photo" | "confirm" | "estimate" | "waiting" | "result";

const clock = (date: Date) =>
  date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// The next meal time still to come today, if any.
function nextMeal(profile: Profile, now: Date): { type: MealType; at: Date } | null {
  for (const type of Object.keys(MEAL_LABELS) as MealType[]) {
    const [h, m] = profile.mealTimes[type].split(":").map(Number);
    const at = new Date(now);
    at.setHours(h, m, 0, 0);
    if (at > now) return { type, at };
  }
  return null;
}

function notify(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body, icon: "/icon.svg" });
  } catch {
    // Some browsers only allow notifications from an installed app; the in-app card still shows.
  }
}

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [logging, setLogging] = useState(false);
  const [stage, setStage] = useState<Stage>("before");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [storageNotice, setStorageNotice] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [remindersOn, setRemindersOn] = useState(false);

  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [fromAi, setFromAi] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [recognising, setRecognising] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);

  const [latestId, setLatestId] = useState<string | null>(null);
  const [swapLoadingIds, setSwapLoadingIds] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // On first load: bring back the profile and saved meals.
  useEffect(() => {
    const { meals: saved, broken } = loadMeals();
    setMeals(saved);
    setStorageNotice(broken);
    setProfile(loadProfile());
    setRemindersOn("Notification" in window && Notification.permission === "granted");
    setLoaded(true);
  }, []);

  // Keep the clock fresh for greetings, countdowns and "due" reminders.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const waitingMeal = findWaitingMeal(meals);
  const dueAt = waitingMeal ? new Date(new Date(waitingMeal.createdAt).getTime() + REMINDER_AFTER_MS) : null;
  const upcoming = profile ? nextMeal(profile, now) : null;

  // Reminders while the app is open: 2 hours after a meal, and at each meal time.
  useEffect(() => {
    if (!remindersOn) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (at: Date, title: string, body: string) => {
      const wait = at.getTime() - Date.now();
      if (wait > 0 && wait < 24 * 3600 * 1000) timers.push(setTimeout(() => notify(title, body), wait));
    };
    if (dueAt) schedule(dueAt, "Glyko: time to check your sugar", "It's been 2 hours since you started eating.");
    if (upcoming) schedule(upcoming.at, `Glyko: ${MEAL_LABELS[upcoming.type].toLowerCase()} time`, "Check your sugar before you eat, then snap your plate.");
    return () => timers.forEach(clearTimeout);
  }, [remindersOn, dueAt?.getTime(), upcoming?.at.getTime(), upcoming?.type]);

  async function turnOnReminders() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setRemindersOn(result === "granted");
  }

  function updateMeals(next: Meal[]) {
    setMeals(next);
    saveMeals(next);
  }

  function finishProfile(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setEditingProfile(false);
  }

  const before = parseReading(beforeText);
  const after = parseReading(afterText);
  const ranked = rankBySpike(meals);
  const todays = mealsOn(meals, now);
  const dishesValid = dishes.length > 0 && dishes.every((d) => d.name.trim() !== "");
  const latestMeal = meals.find((m) => m.id === latestId);
  const mealNow = MEAL_LABELS[mealTypeAt(now)].toLowerCase();
  const loggedNow = todays.some((m) => (m.mealType ?? mealTypeAt(new Date(m.createdAt))) === mealTypeAt(now));

  function startLogging() {
    setBeforeText("");
    setAfterText("");
    setDishes([]);
    setEstimate(null);
    setPhotoError(null);
    setSeconds(null);
    setStage(waitingMeal ? "waiting" : "before");
    setLogging(true);
  }

  function backToToday() {
    setLogging(false);
    setStage("before");
  }

  // Shrink the photo, send it to AI call #1, show dishes or an error.
  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    setSeconds(null);

    let image: string;
    try {
      image = await resizeImage(file);
    } catch {
      setPhotoError("Couldn't open this photo. Try another photo or take a new one.");
      return;
    }

    setRecognising(true);
    const started = performance.now();
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      setSeconds((performance.now() - started) / 1000);
      if (data.ok && data.dishes.length > 0) {
        setDishes(data.dishes);
        setFromAi(true);
        setStage("confirm");
      } else {
        setPhotoError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setPhotoError("Couldn't reach the recogniser. Check your connection and try again.");
    } finally {
      setRecognising(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function typeDishesYourself() {
    setDishes([{ name: "", portion: "", sure: true }]);
    setFromAi(false);
    setPhotoError(null);
    setStage("confirm");
  }

  // Work out the expected spike before the user eats.
  function checkPlate() {
    const cleaned = dishes.map((d) => ({ ...d, name: d.name.trim(), portion: d.portion.trim() }));
    setDishes(cleaned);
    setEstimate(estimateSpike(cleaned, meals));
    setStage("estimate");
  }

  // Save the meal as "waiting for after-reading", with its expected spike.
  function eatAsPlanned() {
    const created = new Date();
    const meal: Meal = {
      id: crypto.randomUUID(),
      createdAt: created.toISOString(),
      before: before!,
      after: null,
      dishes,
      swap: null,
      mealType: mealTypeAt(created),
      expected: estimate?.expected ?? null,
    };
    updateMeals([...meals, meal]);
    setStage("waiting");
  }

  // Save the after-reading, show the spike, then fetch a swap idea.
  function saveAfter() {
    if (!waitingMeal || after === null) return;
    const finished: Meal = { ...waitingMeal, after };
    updateMeals(meals.map((m) => (m.id === finished.id ? finished : m)));
    setLatestId(finished.id);
    setStage("result");
    fetchSwap(finished);
  }

  // AI call #2 for a swap idea; if it fails, fall back to the plain-code swap.
  async function fetchSwap(meal: Meal) {
    setSwapLoadingIds((ids) => [...ids, meal.id]);
    let swap: string | null = null;
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishes: meal.dishes, spike: spike(meal) }),
      });
      const data = await res.json();
      swap = data.swap ?? null;
    } catch {
      swap = null;
    }
    swap ??= estimateSpike(meal.dishes, []).alternatives[0]?.text ?? null;
    setSwapLoadingIds((ids) => ids.filter((id) => id !== meal.id));
    if (!swap) return;
    // Use the latest list of meals, in case something else changed while we waited.
    setMeals((latest) => {
      const next = latest.map((m) => (m.id === meal.id ? { ...m, swap } : m));
      saveMeals(next);
      return next;
    });
  }

  function deleteMeal(meal: Meal) {
    setMeals((latest) => {
      const next = latest.filter((m) => m.id !== meal.id);
      saveMeals(next);
      return next;
    });
  }

  function discardWaitingMeal() {
    if (!waitingMeal) return;
    updateMeals(meals.filter((m) => m.id !== waitingMeal.id));
    backToToday();
  }

  const beforeWarning = before !== null ? readingWarning(before) : null;
  const afterWarning = after !== null ? readingWarning(after) : null;
  const due = dueAt !== null && dueAt <= now;

  return (
    <main>
      <header className="brand">
        <Logo />
        <h1 className="brand-name">glyko</h1>
      </header>
      <p className="sub">Know which meals spike you.</p>

      {storageNotice && (
        <div className="error">Couldn&apos;t read your saved meals, so we started fresh.</div>
      )}

      {loaded && (!profile || editingProfile) && (
        <Onboarding
          initial={editingProfile ? profile : null}
          onDone={finishProfile}
          onCancel={editingProfile ? () => setEditingProfile(false) : undefined}
        />
      )}

      {loaded && profile && !editingProfile && !logging && (
        <>
          <h2>{greeting(now)}, {profile.name}</h2>

          {waitingMeal && dueAt && (
            <section className={`card reminder${due ? " due" : ""}`} role="status">
              <p className="reminder-title">{due ? "Time to check your sugar" : `Check your sugar at ${clock(dueAt)}`}</p>
              <p className="muted" style={{ margin: 0 }}>
                {waitingMeal.dishes.map((d) => d.name).join(", ")} · before {waitingMeal.before} mg/dL
              </p>
              <div className="row">
                <button className="primary" onClick={startLogging}>Enter my reading</button>
              </div>
            </section>
          )}

          {!waitingMeal && (
            <button className="primary" style={{ marginBottom: 12 }} onClick={startLogging}>{loggedNow ? "Log another meal" : `Log ${mealNow}`}</button>
          )}
          <p className="muted reminders-line">
            {upcoming ? `Next: ${MEAL_LABELS[upcoming.type].toLowerCase()} at ${formatTime(profile.mealTimes[upcoming.type])}. ` : "No more meals scheduled today. "}
            {remindersOn ? (
              "Reminders are on while Glyko is open."
            ) : (
              <button className="link" onClick={turnOnReminders}>Turn on reminders</button>
            )}
          </p>

          {meals.length === 0 && (
            <section className="card">
              <Saathi messages={introMessages(profile)} />
            </section>
          )}

          <TodayCard profile={profile} todays={todays} />

          {meals.length > 0 && (
            <section className="card">
              <details>
                <summary>What Saathi told you</summary>
                <Saathi messages={introMessages(profile)} />
              </details>
            </section>
          )}

          <WeekCard meals={meals} />

          <MealRanking
            ranked={ranked}
            latestId={latestId}
            swapLoadingIds={swapLoadingIds}
            onRetrySwap={fetchSwap}
            onDelete={deleteMeal}
          />
        </>
      )}

      {loaded && profile && !editingProfile && logging && (
        <>
          {stage === "before" && (
            <section className="card">
              <label htmlFor="before">What&apos;s your sugar before {mealNow}? (mg/dL)</label>
              <input
                id="before"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 110"
                value={beforeText}
                onChange={(e) => setBeforeText(e.target.value)}
              />
              {beforeText !== "" && before === null && (
                <div className="hint">Enter your glucometer reading, a whole number between 20 and 600.</div>
              )}
              {beforeWarning && <div className="error" role="alert">{beforeWarning}</div>}
              <div className="row">
                <button onClick={backToToday}>Cancel</button>
                <button className="primary" disabled={before === null} onClick={() => setStage("photo")}>
                  Next
                </button>
              </div>
            </section>
          )}

          {stage === "photo" && (
            <section className="card">
              <h2>Snap your plate</h2>
              <p className="muted">Before reading: {before} mg/dL</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                hidden
                onChange={(e) => handlePhoto(e.target.files?.[0])}
              />
              {recognising ? (
                <p><span className="spinner" />Recognising your meal…</p>
              ) : (
                <button className="primary" onClick={() => fileInput.current?.click()}>
                  {photoError ? "Try another photo" : "Take photo"}
                </button>
              )}
              {photoError && <div className="error" role="alert">{photoError}</div>}
              <button className="link" onClick={typeDishesYourself}>Type dishes yourself instead</button>
              <div className="row">
                <button className="link" onClick={() => setStage("before")}>← Change before reading</button>
              </div>
            </section>
          )}

          {stage === "confirm" && (
            <section className="card">
              <h2>What&apos;s on your plate?</h2>
              {fromAi ? (
                <p className="muted">
                  <span className="badge">AI&apos;s guess, please check</span>
                  {seconds !== null && <> Recognised in {seconds.toFixed(1)} s</>}
                </p>
              ) : (
                <p className="muted">Type each dish and its portion, like &quot;Plain dosa · 2&quot; or &quot;Rice · 1 cup&quot;.</p>
              )}
              <DishEditor dishes={dishes} onChange={setDishes} />
              {!dishesValid && <div className="hint">Add at least one dish, and give every dish a name.</div>}
              <div className="row">
                <button onClick={backToToday}>Cancel</button>
                <button className="primary" disabled={!dishesValid} onClick={checkPlate}>
                  Should I eat this?
                </button>
              </div>
            </section>
          )}

          {stage === "estimate" && estimate && before !== null && (
            <EstimateCard
              before={before}
              estimate={estimate}
              nutrition={nutritionFor(dishes)}
              onEat={eatAsPlanned}
              onChange={() => setStage("confirm")}
            />
          )}

          {stage === "waiting" && waitingMeal && dueAt && (
            <section className="card">
              <h2>{due ? "Time to check your sugar" : `Check your sugar at ${clock(dueAt)}`}</h2>
              <p className="muted">
                {waitingMeal.dishes.map((d) => `${d.name}${d.portion ? ` (${d.portion})` : ""}`).join(", ")}
                <br />
                Before: {waitingMeal.before} mg/dL
                {waitingMeal.expected != null && <> · expected spike {formatSpike(waitingMeal.expected)}</>}
                . You can close the app and come back.
              </p>
              {!remindersOn && (
                <button className="link" onClick={turnOnReminders}>Remind me in 2 hours</button>
              )}
              <label htmlFor="after">Sugar 2 hours after eating (mg/dL)</label>
              <input
                id="after"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 160"
                value={afterText}
                onChange={(e) => setAfterText(e.target.value)}
              />
              {afterText !== "" && after === null && (
                <div className="hint">Enter your glucometer reading, a whole number between 20 and 600.</div>
              )}
              {afterWarning && <div className="error" role="alert">{afterWarning}</div>}
              <div className="row">
                <button onClick={backToToday}>Later</button>
                <button className="primary" disabled={after === null} onClick={saveAfter}>
                  See my spike
                </button>
              </div>
              <button className="link" onClick={discardWaitingMeal}>Discard this meal</button>
            </section>
          )}

          {stage === "result" && latestMeal && (
            <section className="card">
              <p className="muted" style={{ margin: 0 }}>This meal spiked you by</p>
              <div className="spike">{formatSpike(spike(latestMeal)!)}</div>
              <SpikeBadge value={spike(latestMeal)!} />
              <p className="muted">
                {latestMeal.before} → {latestMeal.after} mg/dL (measured)
                {latestMeal.expected != null && <> · expected {formatSpike(latestMeal.expected)}</>}
              </p>
              {readingWarning(latestMeal.after!) && (
                <div className="error" role="alert">{readingWarning(latestMeal.after!)}</div>
              )}
              <NutritionFacts nutrition={nutritionFor(latestMeal.dishes)} title="What you ate" tip={false} />
              <Saathi messages={[afterMealNote(latestMeal)]} role="Your Glyko health guide" />
              <div className="row">
                <button className="primary" onClick={backToToday}>Back to today</button>
              </div>
            </section>
          )}
        </>
      )}

      <footer>
        {profile && !editingProfile && (
          <p className="footer-links">
            <button className="link" onClick={() => { setLogging(false); setEditingProfile(true); }}>Edit profile</button>
            {" · "}
            <a href="/demo">See the demo</a>
          </p>
        )}
        For personal tracking, not medical advice.
      </footer>
    </main>
  );
}
