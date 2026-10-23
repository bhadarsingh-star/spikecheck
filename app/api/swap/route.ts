// AI call #2: one swap suggestion for a finished meal, with Gemini.
// If this fails, the app shows a plain-code swap instead (lib/estimate.ts).

import { generateWithFallback, geminiClient } from "@/lib/gemini";

type DishInput = { name: string; portion: string };

export async function POST(request: Request) {
  const ai = geminiClient();
  if (typeof ai === "string") {
    return Response.json({ error: "Gemini API key missing or incomplete" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const dishes: DishInput[] | undefined = body?.dishes;
  const spike: number | undefined = body?.spike;
  if (!Array.isArray(dishes) || dishes.length === 0 || typeof spike !== "number") {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const dishList = dishes.map((d) => `- ${d.name} (${d.portion})`).join("\n");

  try {
    const response = await generateWithFallback(ai, {
      contents: `This home-cooked Indian meal changed blood sugar by ${spike} mg/dL (2 hours after vs before) for an adult with type 2 diabetes:
${dishList}

Suggest ONE realistic, familiar Indian swap for the dish most likely responsible, so the next similar meal spikes less. Under 20 words. Reply with the suggestion only. No medical claims.`,
      config: { temperature: 0.4, maxOutputTokens: 200 },
    }, 15_000);

    const text = response.text?.trim();
    if (!text) return Response.json({ error: "No suggestion" }, { status: 502 });
    return Response.json({ swap: text });
  } catch (error) {
    console.error("swap failed:", error);
    return Response.json({ error: "Swap unavailable" }, { status: 502 });
  }
}
