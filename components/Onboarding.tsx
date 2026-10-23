"use client";

import { useState } from "react";
import {
  CONDITION_LABELS,
  DEFAULT_MEAL_TIMES,
  FOOD_LABELS,
  MEAL_LABELS,
  SEX_LABELS,
  parseOptional,
  type Condition,
  type FoodType,
  type MealType,
  type Profile,
  type Sex,
} from "@/lib/profile";

type Props = {
  initial: Profile | null; // filled in when editing an existing profile
  onDone: (profile: Profile) => void;
  onCancel?: () => void;
};

const STEPS = ["About you", "Your health", "Your meal times"];

function Chips<T extends string>({ options, value, onPick, label }: {
  options: Record<T, string>;
  value: T | T[];
  onPick: (key: T) => void;
  label: string;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="chips" role="group" aria-label={label}>
      {(Object.keys(options) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          className={`chip${selected.includes(key) ? " on" : ""}`}
          aria-pressed={selected.includes(key)}
          onClick={() => onPick(key)}
        >
          {options[key]}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding({ initial, onDone, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : "");
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [foodType, setFoodType] = useState<FoodType | null>(initial?.foodType ?? null);
  const [medicines, setMedicines] = useState(initial?.medicines ?? "");
  const [fasting, setFasting] = useState(initial?.usualFasting ? String(initial.usualFasting) : "");
  const [afterMeals, setAfterMeals] = useState(initial?.usualAfter ? String(initial.usualAfter) : "");
  const [hba1c, setHba1c] = useState(initial?.hba1c ? String(initial.hba1c) : "");
  const [conditions, setConditions] = useState<Condition[]>(initial?.conditions ?? []);
  const [mealTimes, setMealTimes] = useState<Record<MealType, string>>(initial?.mealTimes ?? DEFAULT_MEAL_TIMES);

  const ageValue = parseOptional(age, 18, 110);
  const weightValue = parseOptional(weight, 25, 250);
  const fastingValue = parseOptional(fasting, 20, 600);
  const afterValue = parseOptional(afterMeals, 20, 600);
  const hba1cValue = parseOptional(hba1c, 4, 15);

  const aboutValid = name.trim() !== "" && typeof ageValue === "number" && typeof weightValue === "number" && sex && foodType;
  const healthValid = fastingValue !== undefined && afterValue !== undefined && hba1cValue !== undefined;
  const timesValid = Object.values(mealTimes).every((t) => /^\d{2}:\d{2}$/.test(t));

  function toggleCondition(c: Condition) {
    setConditions((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  }

  function finish() {
    onDone({
      name: name.trim(),
      age: ageValue as number,
      sex: sex as Sex,
      weightKg: weightValue as number,
      foodType: foodType as FoodType,
      medicines: medicines.trim(),
      usualFasting: fastingValue ?? null,
      usualAfter: afterValue ?? null,
      hba1c: hba1cValue ?? null,
      conditions,
      mealTimes,
    });
  }

  return (
    <section className="card">
      <p className="step-label">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      {step === 0 && (
        <>
          <h2>{initial ? "Edit your profile" : "Tell us about you"}</h2>
          <div className="field">
            <label htmlFor="p-name">Name</label>
            <input id="p-name" type="text" autoComplete="given-name" placeholder="Meena" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid2 field">
            <div>
              <label htmlFor="p-age">Age</label>
              <input id="p-age" type="number" inputMode="numeric" placeholder="52" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-weight">Weight (kg)</label>
              <input id="p-weight" type="number" inputMode="decimal" placeholder="68" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          {age !== "" && ageValue === undefined && <p className="hint">Enter an age between 18 and 110.</p>}
          {weight !== "" && weightValue === undefined && <p className="hint">Enter a weight between 25 and 250 kg.</p>}
          <div className="field">
            <p className="field-label">Sex</p>
            <Chips label="Sex" options={SEX_LABELS} value={sex ?? ([] as Sex[])} onPick={setSex} />
          </div>
          <div className="field">
            <p className="field-label">Food type</p>
            <Chips label="Food type" options={FOOD_LABELS} value={foodType ?? ([] as FoodType[])} onPick={setFoodType} />
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h2>Your health</h2>
          <div className="field">
            <label htmlFor="p-meds">Medicines you take (optional)</label>
            <input id="p-meds" type="text" placeholder="Metformin 500 mg after breakfast" value={medicines} onChange={(e) => setMedicines(e.target.value)} />
          </div>
          <div className="grid2 field">
            <div>
              <label htmlFor="p-fasting">Usual fasting sugar</label>
              <input id="p-fasting" type="number" inputMode="numeric" placeholder="128" value={fasting} onChange={(e) => setFasting(e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-after">Usual after meals</label>
              <input id="p-after" type="number" inputMode="numeric" placeholder="175" value={afterMeals} onChange={(e) => setAfterMeals(e.target.value)} />
            </div>
          </div>
          {(fastingValue === undefined || afterValue === undefined) && <p className="hint">Sugar readings are whole numbers between 20 and 600 (mg/dL).</p>}
          <div className="field">
            <label htmlFor="p-hba1c">Latest HbA1c, % (optional)</label>
            <input id="p-hba1c" type="number" inputMode="decimal" placeholder="7.4" value={hba1c} onChange={(e) => setHba1c(e.target.value)} />
            {hba1cValue === undefined && <p className="hint">HbA1c is usually between 4 and 15%.</p>}
          </div>
          <div className="field">
            <p className="field-label">Other health issues</p>
            <Chips label="Other health issues" options={CONDITION_LABELS} value={conditions} onPick={toggleCondition} />
          </div>
          <p className="hint">Saved only on this phone. Leave anything blank if you&apos;re not sure.</p>
        </>
      )}

      {step === 2 && (
        <>
          <h2>When do you usually eat?</h2>
          <p className="muted">Glyko will remind you to check your sugar before each meal and 2 hours after.</p>
          {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
            <div className="field time-row" key={m}>
              <label htmlFor={`p-${m}`}>{MEAL_LABELS[m]}</label>
              <input
                id={`p-${m}`}
                type="time"
                value={mealTimes[m]}
                onChange={(e) => setMealTimes((t) => ({ ...t, [m]: e.target.value }))}
              />
            </div>
          ))}
        </>
      )}

      <div className="row">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)}>Back</button>
        ) : onCancel ? (
          <button type="button" onClick={onCancel}>Cancel</button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="primary"
            disabled={step === 0 ? !aboutValid : !healthValid}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="primary" disabled={!timesValid} onClick={finish}>
            {initial ? "Save profile" : "Meet Saathi"}
          </button>
        )}
      </div>
    </section>
  );
}
