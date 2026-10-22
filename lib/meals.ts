// Plain code only: no AI in this file. Readings, spike maths, ranking and saving.

export type Dish = {
  name: string;
  portion: string;
  sure: boolean; // false = the AI wasn't sure, so the screen highlights it
};

export type Meal = {
  id: string;
  createdAt: string; // ISO date
  before: number; // mg/dL
  after: number | null; // null while waiting for the after-meal reading
  dishes: Dish[];
  swap: string | null; // AI suggestion, null if not fetched yet or failed
};

const STORAGE_KEY = "spikecheck.meals";

export const MIN_READING = 20;
export const MAX_READING = 600;

// Turns what the user typed into a reading, or null if it isn't a sensible one.
export function parseReading(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (value < MIN_READING || value > MAX_READING) return null;
  return value;
}

export function spike(meal: Meal): number | null {
  return meal.after === null ? null : meal.after - meal.before;
}

// Finished meals only, highest spike first.
export function rankBySpike(meals: Meal[]): Meal[] {
  return meals
    .filter((m) => m.after !== null)
    .sort((a, b) => (spike(b) ?? 0) - (spike(a) ?? 0));
}

// The meal still waiting for its after-meal reading, if any.
export function findWaitingMeal(meals: Meal[]): Meal | undefined {
  return meals.find((m) => m.after === null);
}

export function loadMeals(): { meals: Meal[]; broken: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { meals: [], broken: false };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { meals: [], broken: true };
    return { meals: parsed as Meal[], broken: false };
  } catch {
    return { meals: [], broken: true };
  }
}

export function saveMeals(meals: Meal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  } catch {
    // Storage blocked (e.g. private browsing): the app still works for this visit.
  }
}

export function formatSpike(value: number): string {
  return `${value > 0 ? "+" : ""}${value} mg/dL`;
}
