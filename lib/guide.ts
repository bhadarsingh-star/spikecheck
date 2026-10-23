// What Saathi, the guide, says. Plain code: fixed, reviewed sentences filled in
// from the user's own profile and readings, so the advice is always safe.
// Saathi is never presented as a doctor and never comments on medicine doses.

import { spike, type Meal } from "@/lib/meals";
import { LOW_READING, TARGET_AFTER, TARGET_BEFORE, VERY_HIGH_READING, type Profile } from "@/lib/profile";

export function introMessages(p: Profile): string[] {
  const messages = [
    `Namaste ${p.name}. I'm Saathi, your Glyko health guide. I'm not a doctor, but I'll help you understand your sugar, one meal at a time.`,
  ];

  const usual =
    p.usualFasting && p.usualAfter
      ? `Your sugar usually sits at ${p.usualFasting} fasting and ${p.usualAfter} after meals. `
      : "";
  messages.push(
    `${usual}Common targets for type 2 diabetes are ${TARGET_BEFORE.low}–${TARGET_BEFORE.high} before meals and under ${TARGET_AFTER}, 2 hours after. Please confirm your own targets with your doctor.`,
  );

  const protein =
    p.foodType === "nonveg"
      ? "Eggs, fish and chicken (not fried) add protein."
      : p.foodType === "egg"
        ? "Eggs, dal, paneer and sprouts add protein."
        : "Dal, paneer, sprouts and curd add protein.";
  messages.push(
    `Rice, maida and sweets tend to raise sugar the most. ${protein} A 10-minute walk after meals usually helps too.`,
  );

  if (p.conditions.includes("bp")) messages.push("With high blood pressure, I'll also remind you to go easy on salt, pickles and papad.");
  if (p.conditions.includes("cholesterol")) messages.push("For cholesterol, fried food and extra ghee are worth cutting down.");
  if (p.conditions.includes("kidney")) messages.push("With kidney concerns, ask your doctor before eating more dal or protein than usual.");

  messages.push(
    p.medicines
      ? `Keep taking ${p.medicines} exactly as your doctor prescribed. I never change medicines.`
      : "If your doctor prescribes medicines, add them to your profile. I never change medicines.",
  );
  return messages;
}

// A safety note for a single reading, or null when it's in a normal range.
export function readingWarning(value: number): string | null {
  if (value < LOW_READING) return `This reading is low (under ${LOW_READING}). Follow your doctor's advice for low sugar now.`;
  if (value >= VERY_HIGH_READING) return "This reading is very high. If it stays high or you feel unwell, contact your doctor.";
  return null;
}

// Saathi's note after a meal: compares the measured spike with the expected one.
export function afterMealNote(meal: Meal): string {
  const value = spike(meal) ?? 0;
  const peakOk = (meal.after ?? 0) < TARGET_AFTER;
  const expected = meal.expected ?? null;
  let note = peakOk ? `You stayed under ${TARGET_AFTER}. ` : `This went over ${TARGET_AFTER}. `;
  if (expected !== null) {
    const diff = value - expected;
    if (Math.abs(diff) <= 10) note += "Your spike was close to what we expected. ";
    else if (diff < 0) note += `That's ${-diff} lower than expected. Nice. `;
    else note += `That's ${diff} higher than expected. `;
  }
  note += peakOk
    ? "Logging every meal helps me learn what suits you."
    : "Next time, try a smaller portion of rice or roti with more dal or sabzi, and a short walk after.";
  return note;
}

// Saathi's note for today's meals.
export function dayNote(todays: Meal[]): string {
  const done = todays.filter((m) => m.after !== null);
  if (done.length === 0) return "Log your first meal today: check your sugar before you eat, then snap your plate.";
  const best = done.reduce((a, b) => ((spike(a) ?? 0) <= (spike(b) ?? 0) ? a : b));
  const over = done.filter((m) => (m.after ?? 0) >= TARGET_AFTER).length;
  const bestName = best.dishes.map((d) => d.name).join(", ");
  if (done.length === 1) {
    return over === 0
      ? `Your first meal today stayed under ${TARGET_AFTER}. Log your next meal to start comparing.`
      : `Your first meal today went over ${TARGET_AFTER}. Try a lighter plate next time, and log it to compare.`;
  }
  return over === 0
    ? `All ${done.length} meal${done.length > 1 ? "s" : ""} today stayed under ${TARGET_AFTER}. ${bestName} suited you best.`
    : `${over} of ${done.length} meals today went over ${TARGET_AFTER}. ${bestName} suited you best, so build on meals like it.`;
}
