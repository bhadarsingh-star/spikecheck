"use client";

import { useEffect, useRef, useState } from "react";
import DishEditor from "@/components/DishEditor";
import Logo from "@/components/Logo";
import MealRanking from "@/components/MealRanking";
import SpikeBadge from "@/components/SpikeBadge";
import {
  findWaitingMeal,
  formatSpike,
  loadMeals,
  parseReading,
  rankBySpike,
  saveMeals,
  spike,
  type Dish,
  type Meal,
} from "@/lib/meals";
import { resizeImage } from "@/lib/resizeImage";

// The one screen moves through these stages:
// before → photo → confirm → waiting → result
type Stage = "before" | "photo" | "confirm" | "waiting" | "result";

export default function Home() {
  const [stage, setStage] = useState<Stage>("before");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [storageNotice, setStorageNotice] = useState(false);

  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [fromAi, setFromAi] = useState(false);

  const [recognising, setRecognising] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);

  const [latestId, setLatestId] = useState<string | null>(null);
  const [swapLoadingIds, setSwapLoadingIds] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // On first load: bring back saved meals, and resume a meal waiting for its after-reading.
  useEffect(() => {
    const { meals: saved, broken } = loadMeals();
    setMeals(saved);
    setStorageNotice(broken);
    if (findWaitingMeal(saved)) setStage("waiting");
  }, []);

  function updateMeals(next: Meal[]) {
    setMeals(next);
    saveMeals(next);
  }

  const before = parseReading(beforeText);
  const after = parseReading(afterText);
  const waitingMeal = findWaitingMeal(meals);
  const ranked = rankBySpike(meals);
  const dishesValid = dishes.length > 0 && dishes.every((d) => d.name.trim() !== "");

  // Stage 2: shrink the photo, send it to AI call #1, show dishes or an error.
  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    setSeconds(null);

    let image: string;
    try {
      image = await resizeImage(file);
    } catch {
      setPhotoError("Couldn't open this photo. Try a JPG or take a new one.");
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

  // Stage 3: save the confirmed meal as "waiting for after-reading".
  function confirmDishes() {
    const meal: Meal = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      before: before!,
      after: null,
      dishes: dishes.map((d) => ({ ...d, name: d.name.trim(), portion: d.portion.trim() })),
      swap: null,
    };
    updateMeals([...meals, meal]);
    setStage("waiting");
  }

  // Stage 4: work out the spike, save, then ask AI call #2 for a swap.
  function saveAfter() {
    if (!waitingMeal || after === null) return;
    const finished: Meal = { ...waitingMeal, after };
    const next = meals.map((m) => (m.id === finished.id ? finished : m));
    updateMeals(next);
    setLatestId(finished.id);
    setStage("result");
    fetchSwap(finished);
  }

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
    setSwapLoadingIds((ids) => ids.filter((id) => id !== meal.id));
    if (!swap) return;
    // Use the latest list of meals, in case something else changed while we waited.
    setMeals((latest) => {
      const next = latest.map((m) => (m.id === meal.id ? { ...m, swap } : m));
      saveMeals(next);
      return next;
    });
  }

  function discardWaitingMeal() {
    if (!waitingMeal) return;
    updateMeals(meals.filter((m) => m.id !== waitingMeal.id));
    startNewMeal();
  }

  function startNewMeal() {
    setBeforeText("");
    setAfterText("");
    setDishes([]);
    setPhotoError(null);
    setSeconds(null);
    setStage("before");
  }

  const latestMeal = meals.find((m) => m.id === latestId);

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

      {stage === "before" && (
        <section className="card">
          <label htmlFor="before">What&apos;s your sugar before eating? (mg/dL)</label>
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
          <div className="row">
            <button className="primary" disabled={before === null} onClick={() => setStage("photo")}>
              Next
            </button>
          </div>
        </section>
      )}

      {stage === "photo" && (
        <section className="card">
          <h2>Take a photo of your meal</h2>
          <p className="muted">Before reading: {before} mg/dL</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
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
          {photoError && (
            <>
              <div className="error" role="alert">{photoError}</div>
              <button className="link" onClick={typeDishesYourself}>Type dishes yourself instead</button>
            </>
          )}
          <div className="row">
            <button className="link" onClick={() => setStage("before")}>← Change before reading</button>
          </div>
        </section>
      )}

      {stage === "confirm" && (
        <section className="card">
          <h2>Is this your meal?</h2>
          {fromAi ? (
            <p className="muted">
              <span className="badge">AI&apos;s guess, please check</span>
              {seconds !== null && <> Recognised in {seconds.toFixed(1)} s</>}
            </p>
          ) : (
            <p className="muted">Type each dish and its portion.</p>
          )}
          <DishEditor dishes={dishes} onChange={setDishes} />
          {!dishesValid && <div className="hint">Add at least one dish, and give every dish a name.</div>}
          <div className="row">
            <button className="primary" disabled={!dishesValid} onClick={confirmDishes}>
              Looks right
            </button>
          </div>
        </section>
      )}

      {stage === "waiting" && waitingMeal && (
        <section className="card">
          <h2>Check your sugar about 2 hours after you started eating</h2>
          <p className="muted">
            {waitingMeal.dishes.map((d) => `${d.name}${d.portion ? ` (${d.portion})` : ""}`).join(", ")}
            <br />
            Before: {waitingMeal.before} mg/dL. You can close the app and come back.
          </p>
          <label htmlFor="after">Sugar after eating (mg/dL)</label>
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
          <div className="row">
            <button className="primary" disabled={after === null} onClick={saveAfter}>
              See my spike
            </button>
          </div>
          <button className="link" onClick={discardWaitingMeal}>Discard this meal</button>
        </section>
      )}

      {stage === "result" && latestMeal && (
        <section className="card">
          <p className="muted">This meal spiked you by</p>
          <div className="spike">{formatSpike(spike(latestMeal)!)}</div>
          <SpikeBadge value={spike(latestMeal)!} />
          <p className="muted">
            {latestMeal.before} → {latestMeal.after} mg/dL (measured)
          </p>
          <button className="primary" onClick={startNewMeal}>Log another meal</button>
        </section>
      )}

      {(stage === "before" || stage === "result") && (
        <MealRanking
          ranked={ranked}
          latestId={latestId}
          swapLoadingIds={swapLoadingIds}
          onRetrySwap={fetchSwap}
        />
      )}

      <footer>For personal tracking, not medical advice.</footer>
    </main>
  );
}
