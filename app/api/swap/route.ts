// AI call #2: one swap suggestion for a finished meal.

import Anthropic from "@anthropic-ai/sdk";

type DishInput = { name: string; portion: string };

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "paste-your-key-here") {
    return Response.json({ error: "Missing API key" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const dishes: DishInput[] | undefined = body?.dishes;
  const spike: number | undefined = body?.spike;
  if (!Array.isArray(dishes) || dishes.length === 0 || typeof spike !== "number") {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const dishList = dishes.map((d) => `- ${d.name} (${d.portion})`).join("\n");
  const client = new Anthropic({ apiKey, timeout: 15_000, maxRetries: 1 });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 300, // one short sentence
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `This home-cooked Indian meal changed blood sugar by ${spike} mg/dL (2 hours after vs before) for an adult with type 2 diabetes:
${dishList}

Suggest ONE realistic, familiar Indian swap for the dish most likely responsible, so the next similar meal spikes less. Under 20 words. Reply with the suggestion only. No medical claims.`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text.trim();
    if (response.stop_reason === "refusal" || !text) {
      return Response.json({ error: "No suggestion" }, { status: 502 });
    }
    return Response.json({ swap: text });
  } catch (error) {
    console.error("swap failed:", error);
    return Response.json({ error: "Swap unavailable" }, { status: 502 });
  }
}
