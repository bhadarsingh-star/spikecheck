"use client";

import SpikeBadge from "@/components/SpikeBadge";
import { spike, type Meal } from "@/lib/meals";

type Props = {
  ranked: Meal[]; // already sorted, highest spike first
  latestId: string | null;
  swapLoadingIds: string[];
  onRetrySwap: (meal: Meal) => void;
};

export default function MealRanking({ ranked, latestId, swapLoadingIds, onRetrySwap }: Props) {
  if (ranked.length === 0) return null;

  return (
    <section className="card">
      <h2>Your meals, ranked by spike</h2>
      <ol className="rank">
        {ranked.map((meal, i) => {
          const value = spike(meal)!;
          const loading = swapLoadingIds.includes(meal.id);
          return (
            <li key={meal.id}>
              <div className="top">
                <span>
                  {i + 1}. {meal.dishes.map((d) => d.name).join(", ")}
                  {meal.id === latestId && <> <span className="badge">just now</span></>}
                </span>
                <SpikeBadge value={value} />
              </div>
              <div className="muted">
                {meal.before} → {meal.after} mg/dL (measured)
              </div>
              <div className="swap">
                {meal.swap ? (
                  <>
                    <span className="badge">AI suggestion</span> {meal.swap}
                  </>
                ) : loading ? (
                  <span className="muted"><span className="spinner" />Getting a swap idea…</span>
                ) : (
                  <span className="muted">
                    Swap unavailable.{" "}
                    <button className="link" onClick={() => onRetrySwap(meal)}>Retry</button>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
