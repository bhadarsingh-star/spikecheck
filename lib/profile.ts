// The user's profile, saved on this phone. Plain code only.

export type Sex = "female" | "male" | "other";
export type FoodType = "veg" | "nonveg" | "egg" | "jain";
export type Condition = "bp" | "cholesterol" | "kidney" | "thyroid" | "heart";
export type MealType = "breakfast" | "lunch" | "dinner";

export type Profile = {
  name: string;
  age: number;
  sex: Sex;
  weightKg: number;
  foodType: FoodType;
  medicines: string; // as the user typed it, e.g. "Metformin 500 mg after breakfast"
  usualFasting: number | null; // mg/dL
  usualAfter: number | null; // mg/dL
  hba1c: number | null; // %
  conditions: Condition[];
  mealTimes: Record<MealType, string>; // "08:30"
};

export const SEX_LABELS: Record<Sex, string> = { female: "Female", male: "Male", other: "Other" };
export const FOOD_LABELS: Record<FoodType, string> = { veg: "Veg", nonveg: "Non-veg", egg: "Eggetarian", jain: "Jain" };
export const CONDITION_LABELS: Record<Condition, string> = {
  bp: "High blood pressure",
  cholesterol: "Cholesterol",
  kidney: "Kidney",
  thyroid: "Thyroid",
  heart: "Heart",
};
export const MEAL_LABELS: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

// Common type 2 targets; the app always asks people to confirm theirs with a doctor.
export const TARGET_BEFORE = { low: 80, high: 130 };
export const TARGET_AFTER = 180;
export const LOW_READING = 70;
export const VERY_HIGH_READING = 300;

export const DEFAULT_MEAL_TIMES: Record<MealType, string> = { breakfast: "08:30", lunch: "13:30", dinner: "20:30" };

const STORAGE_KEY = "glyko.profile";

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.name === "string" ? (parsed as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage blocked (e.g. private browsing): the profile lasts for this visit only.
  }
}

// Parses an optional number typed into a form: "" → null, out of range → undefined (invalid).
export function parseOptional(text: string, min: number, max: number): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return value >= min && value <= max ? value : undefined;
}

// "13:30" → "1:30 pm"
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

// Which meal a time of day belongs to: before 11 breakfast, before 5 pm lunch, else dinner.
export function mealTypeAt(date: Date): MealType {
  const h = date.getHours();
  if (h < 11) return "breakfast";
  if (h < 17) return "lunch";
  return "dinner";
}
