"use client";

import type { Dish } from "@/lib/meals";

type Props = {
  dishes: Dish[];
  onChange: (dishes: Dish[]) => void;
};

export default function DishEditor({ dishes, onChange }: Props) {
  function update(index: number, field: "name" | "portion", value: string) {
    // Once you've edited a dish, you've checked it, so drop the "not sure" highlight.
    onChange(dishes.map((d, i) => (i === index ? { ...d, [field]: value, sure: true } : d)));
  }

  function remove(index: number) {
    onChange(dishes.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...dishes, { name: "", portion: "", sure: true }]);
  }

  return (
    <div>
      {dishes.map((dish, i) => (
        <div key={i} className={`dish${dish.sure ? "" : " unsure"}`}>
          {!dish.sure && <span className="flag">Not sure, please check</span>}
          <input
            type="text"
            aria-label="Dish name"
            placeholder="Dish, e.g. Dal"
            value={dish.name}
            onChange={(e) => update(i, "name", e.target.value)}
          />
          <input
            type="text"
            aria-label="Portion"
            placeholder="e.g. 1 katori"
            value={dish.portion}
            onChange={(e) => update(i, "portion", e.target.value)}
          />
          <button className="remove" aria-label={`Remove ${dish.name || "dish"}`} onClick={() => remove(i)}>
            ✕
          </button>
        </div>
      ))}
      <button className="link" onClick={add}>+ Add dish</button>
    </div>
  );
}
