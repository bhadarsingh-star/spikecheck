import NutritionFacts from "@/components/NutritionFacts";
import SpikeBadge from "@/components/SpikeBadge";
import Saathi from "@/components/Saathi";
import { nutritionFor, sumNutrition } from "@/lib/estimate";
import { dayNote } from "@/lib/guide";
import { spike, type Meal } from "@/lib/meals";
import { MEAL_LABELS, formatTime, mealTypeAt, type MealType, type Profile } from "@/lib/profile";

// Today's breakfast, lunch and dinner, each logged or still to come.
export default function TodayCard({ profile, todays }: { profile: Profile; todays: Meal[] }) {
  const slots = Object.keys(MEAL_LABELS) as MealType[];
  const typeOf = (m: Meal) => m.mealType ?? mealTypeAt(new Date(m.createdAt));
  return (
    <section className="card">
      <h2>Today</h2>
      <ul className="plain-list">
        {slots.map((slot) => {
          const logged = todays.filter((m) => typeOf(m) === slot);
          if (logged.length === 0) {
            return (
              <li key={slot}>
                <span>{MEAL_LABELS[slot]}<br /><span className="sub-line">Usually at {formatTime(profile.mealTimes[slot])}</span></span>
                <span className="pill">Not logged</span>
              </li>
            );
          }
          return logged.map((m) => (
            <li key={m.id}>
              <span>
                {MEAL_LABELS[slot]}<br />
                <span className="sub-line">
                  {m.dishes.map((d) => d.name).join(", ")} · {m.before}{m.after !== null ? ` → ${m.after}` : ""}
                </span>
              </span>
              {m.after !== null ? <SpikeBadge value={spike(m)!} /> : <span className="pill">Waiting</span>}
            </li>
          ));
        })}
      </ul>
      {todays.length > 0 && (
        <NutritionFacts nutrition={sumNutrition(todays.map((m) => nutritionFor(m.dishes)))} title="Today so far" tip={false} />
      )}
      <Saathi messages={[dayNote(todays)]} role="Your Glyko health guide" />
    </section>
  );
}
