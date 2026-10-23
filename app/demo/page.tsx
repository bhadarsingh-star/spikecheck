"use client";

// A 10-step clickable walkthrough of the full Glyko journey, for pitches.
// Everything here is example data: no login, no AI calls, nothing is saved.

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import SpikeBadge from "@/components/SpikeBadge";
import "./demo.css";

const STEPS = [
  "Welcome",
  "Your profile",
  "Your health",
  "Meet your guide",
  "Before breakfast",
  "Snap your meal",
  "Should I eat this?",
  "2 hours later",
  "Your day",
  "Your week",
];

// Example week: average spike per day, in mg/dL.
const WEEK = [
  { day: "Mon", value: 58 },
  { day: "Tue", value: 54 },
  { day: "Wed", value: 49 },
  { day: "Thu", value: 47 },
  { day: "Fri", value: 44 },
  { day: "Sat", value: 41 },
  { day: "Sun", value: 38 },
];
const WEEK_MAX = 60;
const WEEK_AVERAGE = Math.round(WEEK.reduce((sum, d) => sum + d.value, 0) / WEEK.length);

function Guide({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-guide-head">
      <div className="demo-avatar" aria-hidden="true">S</div>
      <div>
        <p className="demo-guide-name">Saathi</p>
        <p className="demo-guide-role">{children}</p>
      </div>
    </div>
  );
}

function Plate() {
  return (
    <svg className="demo-plate" width="280" height="200" viewBox="0 0 280 200" role="img" aria-label="Photo of 2 plain dosas with sambar and coconut chutney">
      <rect x="0" y="0" width="280" height="200" rx="16" fill="#C9D3CE" />
      <circle cx="140" cy="100" r="88" fill="#DCE3DF" stroke="#13261D" strokeWidth="4" />
      <rect x="54" y="74" width="132" height="32" rx="16" fill="#EDBB64" stroke="#13261D" strokeWidth="4" transform="rotate(-24 120 90)" />
      <rect x="62" y="112" width="132" height="32" rx="16" fill="#E5A94C" stroke="#13261D" strokeWidth="4" transform="rotate(-24 128 128)" />
      <circle cx="206" cy="64" r="26" fill="#AEBBB4" stroke="#13261D" strokeWidth="4" />
      <circle cx="206" cy="64" r="19" fill="#C2561A" />
      <circle cx="198" cy="148" r="20" fill="#AEBBB4" stroke="#13261D" strokeWidth="4" />
      <circle cx="198" cy="148" r="14" fill="#F4F6F5" />
      <circle cx="194" cy="145" r="3" fill="#1E6B47" />
    </svg>
  );
}

export default function Demo() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<"planned" | "swap">("planned");
  const last = STEPS.length - 1;

  const next = () => setStep((s) => Math.min(last, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Each step starts at the top of the screen.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Arrow keys move between steps, handy while presenting.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight") setStep((s) => Math.min(last, s + 1));
      if (event.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  return (
    <main>
      <header className="brand">
        <Logo />
        <p className="brand-name">glyko</p>
      </header>
      <p className="sub">Know which meals spike you.</p>

      <div className="demo-banner">
        <span>Demo with example data</span>
        <span>Use ← → to move</span>
      </div>

      <div className="demo-progress">
        <p className="demo-step-label">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        <div className="demo-bar" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Demo progress">
          <div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <section className="card">
          <h1 className="demo-big" style={{ fontSize: 34, lineHeight: "40px" }}>Eat from your own data, not guesses</h1>
          <p>
            Glyko helps adults in India with type 2 diabetes see how each home-cooked meal affects their blood sugar,
            and choose better meals every day.
          </p>
          <ul className="demo-list">
            <li><span>Track sugar before and after every meal</span></li>
            <li><span>Snap your plate to see the expected spike</span></li>
            <li><span>Get a caring guide for diet and reminders</span></li>
          </ul>
        </section>
      )}

      {step === 1 && (
        <section className="card">
          <h2>Tell us about you</h2>
          <div className="demo-field">
            <p className="demo-label">Name</p>
            <div className="demo-value">Meena Sharma</div>
          </div>
          <div className="demo-grid2 demo-field">
            <div>
              <p className="demo-label">Age</p>
              <div className="demo-value">52</div>
            </div>
            <div>
              <p className="demo-label">Weight</p>
              <div className="demo-value">68 kg</div>
            </div>
          </div>
          <div className="demo-field">
            <p className="demo-label">Sex</p>
            <div className="demo-choice">
              <span className="demo-chip">Male</span>
              <span className="demo-chip on">Female</span>
              <span className="demo-chip">Other</span>
            </div>
          </div>
          <div>
            <p className="demo-label">Food type</p>
            <div className="demo-choice">
              <span className="demo-chip on">Veg</span>
              <span className="demo-chip">Non-veg</span>
              <span className="demo-chip">Eggetarian</span>
              <span className="demo-chip">Jain</span>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <h2>Your health</h2>
          <div className="demo-field">
            <p className="demo-label">Medicines you take</p>
            <div className="demo-value">Metformin 500 mg, after breakfast and dinner</div>
          </div>
          <div className="demo-field">
            <p className="demo-label">Your usual sugar</p>
            <div className="demo-grid2">
              <div className="demo-value">Fasting: 128 mg/dL</div>
              <div className="demo-value">After meals: 175 mg/dL</div>
            </div>
          </div>
          <div className="demo-field">
            <p className="demo-label">Latest HbA1c (3-month average)</p>
            <div className="demo-value">7.4%</div>
          </div>
          <div>
            <p className="demo-label">Other health issues</p>
            <div className="demo-choice">
              <span className="demo-chip on">High blood pressure</span>
              <span className="demo-chip">Cholesterol</span>
              <span className="demo-chip">Kidney</span>
              <span className="demo-chip">Thyroid</span>
            </div>
          </div>
          <p className="hint">Saved only to your account. You choose what to share.</p>
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <Guide>Your Glyko health guide · not a doctor</Guide>
          <div className="demo-chat">
            <div className="demo-msg">Namaste Meena. I&apos;m Saathi. I&apos;ll help you understand your sugar, one meal at a time.</div>
            <div className="demo-msg">
              Your sugar usually sits at <strong>128 fasting</strong> and <strong>175 after meals</strong>. Common targets for type 2
              diabetes are <strong>80–130 before meals</strong> and <strong>under 180, 2 hours after</strong>. Please confirm your own
              targets with your doctor.
            </div>
            <div className="demo-msg">
              Rice, maida and sweets tend to raise sugar the most. Dal, sabzi, curd and a 10-minute walk after meals usually help.
              With your blood pressure, I&apos;ll also suggest less salt.
            </div>
            <div className="demo-msg">Keep taking Metformin exactly as your doctor prescribed. I never change medicines.</div>
          </div>
          <h2 style={{ marginTop: 24 }}>Your reminders</h2>
          <ul className="demo-list">
            <li><span>Breakfast · 8:30 am<br /><span className="demo-sub">Check sugar before and 2 hours after</span></span><span className="demo-on">On</span></li>
            <li><span>Lunch · 1:30 pm<br /><span className="demo-sub">Check sugar before and 2 hours after</span></span><span className="demo-on">On</span></li>
            <li><span>Dinner · 8:30 pm<br /><span className="demo-sub">Check sugar before and 2 hours after</span></span><span className="demo-on">On</span></li>
          </ul>
        </section>
      )}

      {step === 4 && (
        <section className="card">
          <h2>Good morning, Meena</h2>
          <p className="demo-label">What&apos;s your sugar before breakfast? (mg/dL)</p>
          <div className="demo-value demo-big" style={{ fontSize: 34 }}>112</div>
          <p className="muted">8:32 am · within the 80–130 target before meals</p>
        </section>
      )}

      {step === 5 && (
        <section className="card">
          <h2>Snap your plate</h2>
          <Plate />
          <p className="muted"><span className="badge">AI&apos;s guess, please check</span> Recognised in 4.2 s</p>
          <ul className="demo-list">
            <li><span>Plain dosa</span><span className="demo-sub">2 dosas</span></li>
            <li><span>Sambar</span><span className="demo-sub">1 katori</span></li>
            <li><span>Coconut chutney</span><span className="demo-sub">2 tablespoons</span></li>
          </ul>
          <p className="hint">Tap any dish to change it, or add one that&apos;s missing.</p>
        </section>
      )}

      {step === 6 && (
        <section className="card">
          <h2>Should I eat this?</h2>
          <p className="muted">Expected spike from this meal</p>
          <div className="demo-big">+55 mg/dL</div>
          <SpikeBadge value={55} />
          <p>
            Your sugar would reach about <strong>167 mg/dL</strong> after 2 hours: under your 180 target, but close.
          </p>
          <span className="demo-verdict">OK in moderation</span>
          <h2 style={{ marginTop: 24 }}>Better options</h2>
          <ul className="demo-list">
            <li><span>1 dosa with extra sambar</span><SpikeBadge value={35} /></li>
            <li><span>Ragi dosa instead of plain</span><SpikeBadge value={30} /></li>
            <li><span>Add sprouts or a boiled egg first</span><SpikeBadge value={45} /></li>
          </ul>
          <p className="hint">Estimates from typical values for these dishes, adjusted to your own past meals as you log more.</p>
          <div className="row">
            <button className={choice === "planned" ? "primary" : ""} onClick={() => setChoice("planned")}>Eat as planned</button>
            <button className={choice === "swap" ? "primary" : ""} onClick={() => setChoice("swap")}>Choose a swap</button>
          </div>
        </section>
      )}

      {step === 7 && (
        <section className="card">
          <div className="demo-notify" role="status">
            <Logo />
            <p>
              <strong>Glyko · 10:32 am</strong><br />
              Time to check your sugar. It&apos;s been 2 hours since breakfast.
              <br /><span className="demo-sub">Reminder</span>
            </p>
          </div>
          <p className="demo-label">Sugar 2 hours after breakfast (mg/dL)</p>
          <div className="demo-value demo-big" style={{ fontSize: 34 }}>168</div>
          <div className="demo-compare">
            <div>
              <p className="muted" style={{ margin: 0 }}>Expected</p>
              <div className="demo-big">+55</div>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Measured</p>
              <div className="demo-big">+56</div>
              <SpikeBadge value={56} />
            </div>
          </div>
          <Guide>Your Glyko health guide</Guide>
          <div className="demo-msg">
            {choice === "planned"
              ? "Your spike matched what we expected, and you stayed under 180. Next time, try 1 dosa with extra sambar and a short walk after."
              : "Good choice trying a swap. Logging it helps me learn which breakfasts suit you best."}
          </div>
        </section>
      )}

      {step === 8 && (
        <section className="card">
          <h2>Today, 3 meals logged</h2>
          <ul className="demo-list">
            <li>
              <span>Breakfast · 8:30 am<br /><span className="demo-sub">2 plain dosas, sambar, chutney · 112 → 168</span></span>
              <SpikeBadge value={56} />
            </li>
            <li>
              <span>Lunch · 1:30 pm<br /><span className="demo-sub">2 rotis, dal, bhindi sabzi · 118 → 146</span></span>
              <SpikeBadge value={28} />
            </li>
            <li>
              <span>Dinner · 8:30 pm<br /><span className="demo-sub">Jeera rice, rajma · 121 → 183</span></span>
              <SpikeBadge value={62} />
            </li>
          </ul>
          <Guide>Your Glyko health guide</Guide>
          <div className="demo-msg">
            Lunch suited you best today. Dinner went just over 180. Tomorrow, try half the rice with extra rajma and salad.
          </div>
        </section>
      )}

      {step === 9 && (
        <section className="card">
          <h2>Your week</h2>
          <p className="muted" style={{ margin: 0 }}>Average spike per day</p>
          <div className="demo-chart" role="img" aria-label={`Average spike fell from +${WEEK[0].value} on Monday to +${WEEK[6].value} on Sunday`}>
            {WEEK.map((d) => (
              <div className="demo-col" key={d.day}>
                <span className="demo-n">+{d.value}</span>
                <div
                  className={`demo-fill ${d.value > 50 ? "high" : d.value >= 30 ? "mid" : ""}`}
                  style={{ height: `${(d.value / WEEK_MAX) * 120}px` }}
                />
              </div>
            ))}
          </div>
          <div className="demo-days" aria-hidden="true">
            {WEEK.map((d) => <span key={d.day}>{d.day}</span>)}
          </div>
          <ul className="demo-list" style={{ marginTop: 16 }}>
            <li><span>Average spike this week</span><strong>+{WEEK_AVERAGE} mg/dL</strong></li>
            <li><span>Spikes you most<br /><span className="demo-sub">Jeera rice and rajma · plain dosa</span></span><SpikeBadge value={62} /></li>
            <li><span>Suits you best<br /><span className="demo-sub">Roti, dal and sabzi · idli and sambar</span></span><SpikeBadge value={27} /></li>
          </ul>
          <Guide>Your Glyko health guide</Guide>
          <div className="demo-msg">
            Your spikes came down every day this week, from +{WEEK[0].value} to +{WEEK[6].value}. Keep the after-meal walks going.
            Want a summary to show your doctor at your next visit?
          </div>
          <div className="row">
            <button className="primary" onClick={() => setStep(0)}>Start the demo again</button>
          </div>
        </section>
      )}

      <nav className="demo-nav" aria-label="Demo steps">
        <button onClick={back} disabled={step === 0}>Back</button>
        <button className="primary" onClick={next} disabled={step === last}>Next</button>
      </nav>

      <footer>For personal tracking, not medical advice. Example data only.</footer>
    </main>
  );
}
