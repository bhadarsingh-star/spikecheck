// AI call #1: recognise the dishes in a meal photo.
// Runs on the server, so the API key never reaches the phone.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The fixed shape Claude must answer in, so the code never has to read free text.
const MealAnalysis = z.object({
  status: z.enum(["ok", "not_food", "unclear"]),
  dishes: z.array(
    z.object({
      name: z.string(),
      portion: z.string(),
      sure: z.boolean(),
    }),
  ),
});

const PROMPT = `This photo was taken by an adult in India with type 2 diabetes, just before eating a home-cooked meal.

List each dish you can clearly see:
- name: the common Indian name (e.g. "Rajma", "Jeera rice", "Bhindi sabzi", "Phulka roti").
- portion: an estimate in household units (katori, cup, piece, roti count, tablespoon), e.g. "1 katori", "2 rotis".
- sure: false if you are not confident about this dish, true otherwise.

Set status:
- "ok" if the photo shows food and you listed at least one dish.
- "not_food" if the photo is not food (an object, a person, a screen, a blank image, etc.). Leave dishes empty.
- "unclear" if it may be food but is too blurry, dark or far away to tell. Leave dishes empty.

Never guess a dish you cannot see. An empty list is better than a made-up dish.`;

const ERRORS = {
  badInput: "Please upload a photo of your meal.",
  notFood: "This doesn't look like food. Please take a photo of your meal.",
  unclear: "We couldn't recognise this meal. Try a clearer, brighter photo taken from above.",
  noKey: "The app isn't set up yet (missing API key).",
  badKey: "The app's API key was not accepted. Check .env.local.",
  timeout: "Recognising took too long. Please try again.",
  network: "Couldn't reach the recogniser. Check your connection and try again.",
  busy: "The recogniser is busy right now. Please try again in a minute.",
  other: "Something went wrong recognising the photo. Please try again.",
};

function fail(error: string, status: number) {
  // Every failure returns an empty dish list, so nothing made-up can reach the screen.
  return Response.json({ ok: false, error, dishes: [] }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "paste-your-key-here") return fail(ERRORS.noKey, 500);

  const body = await request.json().catch(() => null);
  const image = body?.image;
  // The browser always sends a JPEG; base64 JPEGs start with "/9j/".
  if (typeof image !== "string" || !image.startsWith("/9j/")) return fail(ERRORS.badInput, 400);
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return fail(ERRORS.badInput, 400);

  const client = new Anthropic({ apiKey, timeout: 12_000, maxRetries: 0 });

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-5-5",
      max_tokens: 2000, // the answer is a short list
      output_config: { effort: "low", format: zodOutputFormat(MealAnalysis) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const result = response.parsed_output;
    if (response.stop_reason === "refusal" || !result) return fail(ERRORS.unclear, 422);
    if (result.status === "not_food") return fail(ERRORS.notFood, 422);
    if (result.status !== "ok") return fail(ERRORS.unclear, 422);

    const dishes = result.dishes.filter((d) => d.name.trim() !== "");
    if (dishes.length === 0) return fail(ERRORS.unclear, 422);

    return Response.json({ ok: true, dishes });
  } catch (error) {
    console.error("analyze-meal failed:", error);
    if (error instanceof Anthropic.AuthenticationError) return fail(ERRORS.badKey, 500);
    if (error instanceof Anthropic.RateLimitError) return fail(ERRORS.busy, 503);
    if (error instanceof Anthropic.APIConnectionTimeoutError) return fail(ERRORS.timeout, 504);
    if (error instanceof Anthropic.APIConnectionError) return fail(ERRORS.network, 502);
    return fail(ERRORS.other, 500);
  }
}
