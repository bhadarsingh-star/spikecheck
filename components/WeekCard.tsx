import SpikeBadge from "@/components/SpikeBadge";
import { mealsOn, spike, type Meal } from "@/lib/meals";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The last 7 days: average spike per day, drawn to scale, plus best and worst meals.
export default function WeekCard({ meals }: { meals: Meal[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const spikes = mealsOn(meals, day).map(spike).filter((s): s is number => s !== null);
    const average = spikes.length ? Math.round(spikes.reduce((a, b) => a + b, 0) / spikes.length) : null;
    return { name: DAY_NAMES[day.getDay()], average };
  });

  const weekMeals = meals.filter(
    (m) => m.after !== null && today.getTime() - new Date(m.createdAt).getTime() < 7 * 86400000,
  );
  if (weekMeals.length === 0) return null;

  const sorted = [...weekMeals].sort((a, b) => (spike(b) ?? 0) - (spike(a) ?? 0));
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const weekAverage = Math.round(weekMeals.reduce((sum, m) => sum + (spike(m) ?? 0), 0) / weekMeals.length);
  const max = Math.max(60, ...days.map((d) => d.average ?? 0));
  const names = (m: Meal) => m.dishes.map((d) => d.name).join(", ");

  return (
    <section className="card">
      <h2>Your week</h2>
      <p className="muted" style={{ margin: 0 }}>Average spike per day</p>
      <div className="week-chart" role="img" aria-label={`Average spike per day for the last 7 days. This week's average is ${weekAverage} mg/dL.`}>
        {days.map((d, i) => (
          <div className="week-col" key={i}>
            <span className="week-n">{d.average === null ? "–" : `${d.average > 0 ? "+" : ""}${d.average}`}</span>
            <div
              className={`week-fill ${d.average !== null && d.average > 50 ? "high" : d.average !== null && d.average >= 30 ? "mid" : ""}`}
              style={{ height: `${d.average === null ? 0 : (Math.max(d.average, 0) / max) * 110}px` }}
            />
          </div>
        ))}
      </div>
      <div className="week-days" aria-hidden="true">
        {days.map((d, i) => <span key={i}>{d.name}</span>)}
      </div>
      <ul className="plain-list" style={{ marginTop: 16 }}>
        <li><span>Average spike, last 7 days</span><strong>{weekAverage > 0 ? "+" : ""}{weekAverage} mg/dL</strong></li>
        {weekMeals.length > 1 && (
          <>
            <li><span>Spiked you most<br /><span className="sub-line">{names(worst)}</span></span><SpikeBadge value={spike(worst)!} /></li>
            <li><span>Suited you best<br /><span className="sub-line">{names(best)}</span></span><SpikeBadge value={spike(best)!} /></li>
          </>
        )}
      </ul>
    </section>
  );
}
