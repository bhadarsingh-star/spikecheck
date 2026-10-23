"use client";

import NutritionFacts from "@/components/NutritionFacts";
import SpikeBadge from "@/components/SpikeBadge";
import { verdictFor, type Estimate, type Nutrition } from "@/lib/estimate";
import { formatSpike } from "@/lib/meals";
import { TARGET_AFTER } from "@/lib/profile";

// "Should I eat this?": the expected spike, a plain-rule verdict and lighter options.
export default function EstimateCard({ before, estimate, nutrition, onEat, onChange }: {
  before: number;
  estimate: Estimate;
  nutrition: Nutrition;
  onEat: () => void;
  onChange: () => void;
}) {
  const peak = before + estimate.expected;
  const verdict = verdictFor(before, estimate.expected);
  return (
    <section className="card">
      <h2>Should I eat this?</h2>
      <p className="muted" style={{ margin: 0 }}>Expected spike from this meal</p>
      <div className="spike">{formatSpike(estimate.expected)}</div>
      <SpikeBadge value={estimate.expected} />
      <p>
        Your sugar would reach about <strong>{peak} mg/dL</strong> after 2 hours
        {peak < TARGET_AFTER ? `, under the ${TARGET_AFTER} target.` : `, over the ${TARGET_AFTER} target.`}
      </p>
      <span className={`verdict ${verdict.tone}`}>{verdict.label}</span>

      <NutritionFacts nutrition={nutrition} title="This plate" />

      {estimate.alternatives.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Lighter options</h2>
          <ul className="plain-list">
            {estimate.alternatives.map((a) => (
              <li key={a.text}>
                <span>{a.text}</span>
                <SpikeBadge value={a.expected} />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="hint">
        {estimate.source === "history"
          ? `Based on ${estimate.pastMeals} time${estimate.pastMeals > 1 ? "s" : ""} you ate this plate before.`
          : "A rough estimate from typical values for these dishes. It gets personal as you log more meals."}
      </p>
      <div className="row">
        <button className="primary" onClick={onEat}>Eat as planned</button>
        <button onClick={onChange}>Change my plate</button>
      </div>
    </section>
  );
}
