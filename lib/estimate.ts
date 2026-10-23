// "Should I eat this?": an expected spike for a plate, worked out in plain code.
// The per-portion numbers are rough typical values for common Indian dishes,
// shown to users as an estimate. Once someone has logged the same plate before,
// their own measured spikes replace the estimate.

import { spike, type Dish, type Meal } from "@/lib/meals";
import { TARGET_AFTER } from "@/lib/profile";

// Rough nutrition for one portion: calories (kcal), then carbs, protein, fat and fibre in grams.
type Nutrients = { kcal: number; carbs: number; protein: number; fat: number; fibre: number };
const n = (kcal: number, carbs: number, protein: number, fat: number, fibre: number): Nutrients =>
  ({ kcal, carbs, protein, fat, fibre });

type DishRule = {
  match: RegExp;
  perPortion: number; // rough spike in mg/dL for one portion (1 piece, cup or katori)
  nutrients: Nutrients; // rough typical values for one portion
  swap?: { text: string; factor: number }; // a lighter option and how much of this dish's spike it keeps
};

// First match wins, so more specific names come first.
// Portions: rice, khichdi, poha = 1 cup or plate; dal, sabzi, curd = 1 katori;
// roti, dosa, idli, paratha, egg, fruit, sweet = 1 piece; chutney, pickle = 1 tablespoon.
const RULES: DishRule[] = [
  { match: /ragi|millet|bajra|jowar/, perPortion: 9, nutrients: n(110, 18, 3, 3, 3) },
  { match: /khichdi|daliya|oats/, perPortion: 22, nutrients: n(220, 35, 8, 5, 4) },
  { match: /rice|chawal|pulao|biryani|fried rice|curd rice|lemon rice/, perPortion: 35, nutrients: n(200, 44, 4, 1, 1), swap: { text: "Half the rice, with extra dal or sabzi", factor: 0.55 } },
  { match: /dosa|uttapam/, perPortion: 18, nutrients: n(135, 22, 3, 4, 1), swap: { text: "Ragi dosa instead, or one dosa fewer with extra sambar", factor: 0.55 } },
  { match: /idli/, perPortion: 8, nutrients: n(60, 12, 2, 0, 1), swap: { text: "One idli fewer, with extra sambar", factor: 0.7 } },
  { match: /paratha|naan|kulcha|bhatura|puri|poori/, perPortion: 17, nutrients: n(210, 30, 5, 8, 3), swap: { text: "Plain roti instead", factor: 0.6 } },
  { match: /roti|chapati|chapathi|phulka/, perPortion: 10, nutrients: n(80, 15, 3, 1, 2), swap: { text: "One roti fewer, with extra sabzi", factor: 0.7 } },
  { match: /poha|upma|sabudana|vada|pav|bread|toast|maggi|noodle|pasta/, perPortion: 24, nutrients: n(250, 42, 5, 7, 2), swap: { text: "A smaller plate, with sprouts or peanuts added", factor: 0.7 } },
  { match: /aloo|potato|batata/, perPortion: 12, nutrients: n(150, 20, 2, 7, 2), swap: { text: "A green sabzi instead of potato", factor: 0.4 } },
  { match: /gulab|jalebi|halwa|kheer|ladoo|laddu|barfi|mithai|sweet|payasam|rasgulla|ice cream|cake/, perPortion: 30, nutrients: n(150, 25, 2, 5, 0), swap: { text: "Skip the sweet, or have half", factor: 0.5 } },
  { match: /juice|cola|soft drink|sharbat|lassi/, perPortion: 22, nutrients: n(110, 26, 1, 0, 0), swap: { text: "Water or chaas instead", factor: 0.1 } },
  { match: /tea|chai|coffee/, perPortion: 7, nutrients: n(70, 10, 2, 2, 0), swap: { text: "Tea or coffee without sugar", factor: 0.2 } },
  { match: /banana|mango|chikoo|grapes|fruit/, perPortion: 12, nutrients: n(100, 25, 1, 0, 3) },
  { match: /rajma|chole|chana|lobia/, perPortion: 8, nutrients: n(210, 30, 11, 5, 9) },
  { match: /dal|sambar|rasam|kadhi/, perPortion: 5, nutrients: n(120, 16, 7, 3, 4) },
  { match: /curd|dahi|raita|buttermilk|chaas/, perPortion: 2, nutrients: n(60, 5, 4, 3, 0) },
  { match: /egg|omelette|anda/, perPortion: 1, nutrients: n(75, 1, 6, 5, 0) },
  { match: /paneer|chicken|fish|mutton|tofu|soya/, perPortion: 2, nutrients: n(160, 3, 16, 9, 0) },
  { match: /sprouts/, perPortion: 3, nutrients: n(90, 14, 6, 1, 4) },
  { match: /sabzi|subzi|bhindi|palak|gobi|cabbage|beans|curry|salad|kootu|poriyal/, perPortion: 3, nutrients: n(90, 10, 3, 5, 4) },
  { match: /chutney|pickle|achar|papad/, perPortion: 1, nutrients: n(35, 2, 1, 3, 1) },
];
const UNKNOWN_DISH = 8;

// How many portions a portion string describes: "2 dosas" → 2, "1/2 cup" → 0.5, "half plate" → 0.5.
function portions(text: string): number {
  const t = text.toLowerCase();
  const fraction = t.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = t.match(/\d+(\.\d+)?/);
  if (number) return Math.min(Number(number[0]), 10);
  if (/half|aadha/.test(t)) return 0.5;
  return 1;
}

function dishSpike(dish: Dish): { value: number; rule?: DishRule } {
  const rule = RULES.find((r) => r.match.test(dish.name.toLowerCase()));
  return { value: (rule?.perPortion ?? UNKNOWN_DISH) * portions(dish.portion || dish.name), rule };
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

const plateKey = (dishes: Dish[]) =>
  dishes.map((d) => d.name.trim().toLowerCase()).sort().join("|");

export type Estimate = {
  expected: number; // mg/dL
  source: "history" | "typical";
  pastMeals: number; // how many of the user's own meals the history estimate uses
  alternatives: { text: string; expected: number }[];
};

export function estimateSpike(dishes: Dish[], pastMeals: Meal[]): Estimate {
  const parts = dishes.map(dishSpike);
  const typical = parts.reduce((sum, p) => sum + p.value, 0);

  // The same plate eaten before: use the user's own average spike instead.
  const key = plateKey(dishes);
  const same = pastMeals.filter((m) => m.after !== null && plateKey(m.dishes) === key);
  const expected = same.length > 0
    ? Math.round(same.reduce((sum, m) => sum + (spike(m) ?? 0), 0) / same.length)
    : roundTo5(Math.min(typical, 120));

  // Swaps for the dishes that add the most, biggest first, then a walk.
  const scale = typical > 0 ? expected / typical : 1;
  const alternatives: Estimate["alternatives"] = [];
  parts
    .map((p, i) => ({ ...p, dish: dishes[i] }))
    .filter((p) => p.rule?.swap)
    .sort((a, b) => b.value - a.value)
    .forEach((p) => {
      const saved = p.value * (1 - p.rule!.swap!.factor) * scale;
      const text = p.rule!.swap!.text;
      if (saved >= 5 && !alternatives.some((a) => a.text === text)) {
        alternatives.push({ text, expected: roundTo5(expected - saved) });
      }
    });
  if (expected >= 20) alternatives.push({ text: "Same plate, plus a 10-minute walk after eating", expected: roundTo5(expected * 0.85) });

  return {
    expected,
    source: same.length > 0 ? "history" : "typical",
    pastMeals: same.length,
    alternatives: alternatives.slice(0, 3),
  };
}

export type Verdict = { label: string; tone: "good" | "ok" | "swap" };

// Plain rule on the expected 2-hour reading (before + expected spike).
export function verdictFor(before: number, expected: number): Verdict {
  const peak = before + expected;
  if (peak <= 140) return { label: "Good choice", tone: "good" };
  if (peak < TARGET_AFTER) return { label: "OK in moderation", tone: "ok" };
  return { label: "Try a swap", tone: "swap" };
}

export type Nutrition = Nutrients & {
  missing: string[]; // dishes not in the table, so not counted
};

// Rough calories, carbs, protein, fat and fibre for a plate, from typical values per portion.
export function nutritionFor(dishes: Dish[]): Nutrition {
  const total: Nutrition = { kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0, missing: [] };
  for (const dish of dishes) {
    const rule = RULES.find((r) => r.match.test(dish.name.toLowerCase()));
    if (!rule) {
      total.missing.push(dish.name);
      continue;
    }
    const count = portions(dish.portion || dish.name);
    total.kcal += rule.nutrients.kcal * count;
    total.carbs += rule.nutrients.carbs * count;
    total.protein += rule.nutrients.protein * count;
    total.fat += rule.nutrients.fat * count;
    total.fibre += rule.nutrients.fibre * count;
  }
  total.kcal = Math.round(total.kcal / 10) * 10;
  total.carbs = Math.round(total.carbs);
  total.protein = Math.round(total.protein);
  total.fat = Math.round(total.fat);
  total.fibre = Math.round(total.fibre);
  return total;
}

// Adds several meals' nutrition together (for the day's totals).
export function sumNutrition(list: Nutrition[]): Nutrition {
  return list.reduce(
    (sum, x) => ({
      kcal: sum.kcal + x.kcal,
      carbs: sum.carbs + x.carbs,
      protein: sum.protein + x.protein,
      fat: sum.fat + x.fat,
      fibre: sum.fibre + x.fibre,
      missing: [...sum.missing, ...x.missing],
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0, missing: [] } as Nutrition,
  );
}

// One plain tip about the plate's balance, or null when it looks balanced.
// Carbs give 4 kcal per gram, so their share of calories shows how carb-heavy a plate is.
export function nutritionTip(x: Nutrition): string | null {
  if (x.kcal === 0) return null;
  const carbShare = (x.carbs * 4) / x.kcal;
  if (carbShare >= 0.65 && x.protein < 12) return "Mostly carbs. Adding dal, curd, sprouts or an egg balances the plate and usually softens the spike.";
  if (x.protein < 8) return "Low in protein. A katori of dal or curd would help.";
  if (x.fibre < 4) return "Low in fibre. Adding sabzi or salad usually softens the spike.";
  if (x.protein >= 15 && carbShare < 0.6) return "Good balance of protein and carbs.";
  return null;
}
