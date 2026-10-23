import { nutritionTip, type Nutrition } from "@/lib/estimate";

// Calories, carbs, protein, fat and fibre for a meal, as five small tiles,
// with a one-line balance tip. Always labelled as a rough estimate.
export default function NutritionFacts({ nutrition, title = "Nutrition", tip = true }: {
  nutrition: Nutrition;
  title?: string;
  tip?: boolean;
}) {
  const advice = tip ? nutritionTip(nutrition) : null;
  const facts = [
    { label: "Calories", value: `${nutrition.kcal}`, unit: "kcal" },
    { label: "Carbs", value: `${nutrition.carbs}`, unit: "g" },
    { label: "Protein", value: `${nutrition.protein}`, unit: "g" },
    { label: "Fat", value: `${nutrition.fat}`, unit: "g" },
    { label: "Fibre", value: `${nutrition.fibre}`, unit: "g" },
  ];
  return (
    <div className="nutrition">
      <p className="nutrition-title">{title} <span className="sub-line">· rough estimate</span></p>
      <dl className="nutrition-grid">
        {facts.map((f) => (
          <div key={f.label} className="nutrition-tile">
            <dt>{f.label}</dt>
            <dd>{f.value}<span> {f.unit}</span></dd>
          </div>
        ))}
      </dl>
      {advice && <p className="nutrition-tip">{advice}</p>}
      {nutrition.missing.length > 0 && (
        <p className="hint">Not counted: {nutrition.missing.join(", ")} (not in our dish list yet).</p>
      )}
    </div>
  );
}
