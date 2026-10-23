// AI call #1: recognise the dishes in a meal photo, with Gemini.
// Runs on the server, so the API key never reaches the phone.

import { ApiError } from "@google/genai";
import { z } from "zod";
import { generateWithFallback, geminiClient, isBusy, timeLimit } from "@/lib/gemini";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The fixed shape Gemini must answer in, so the code never has to read free text.
// Gemini is told the shape (RESPONSE_SCHEMA); the reply is checked against it again here.
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

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "not_food", "unclear"] },
    dishes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          portion: { type: "string" },
          sure: { type: "boolean" },
        },
        required: ["name", "portion", "sure"],
      },
    },
  },
  required: ["status", "dishes"],
};

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
  noKey: "The app isn't set up yet (missing Gemini API key).",
  malformedKey: "The app's Gemini API key looks incomplete. Copy the full key again.",
  badKey: "The app's Gemini API key was not accepted.",
  timeout: "Recognising took too long. Please try again.",
  busy: "The recogniser is busy right now. Please try again in a minute.",
  other: "Something went wrong recognising the photo. Please try again.",
};

function fail(error: string, status: number) {
  // Every failure returns an empty dish list, so nothing made-up can reach the screen.
  return Response.json({ ok: false, error, dishes: [] }, { status });
}

export async function POST(request: Request) {
  const ai = geminiClient();
  if (ai === "missing") return fail(ERRORS.noKey, 500);
  if (ai === "malformed") return fail(ERRORS.malformedKey, 500);

  const body = await request.json().catch(() => null);
  const image = body?.image;
  // The browser always sends a JPEG; base64 JPEGs start with "/9j/".
  if (typeof image !== "string" || !image.startsWith("/9j/")) return fail(ERRORS.badInput, 400);
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return fail(ERRORS.badInput, 400);

  try {
    const response = await generateWithFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
        abortSignal: timeLimit(12_000),
      },
    });

    // Blocked or empty replies, or anything not in the fixed shape, count as "unclear".
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(response.text ?? "");
    } catch {
      parsed = null;
    }
    const result = MealAnalysis.safeParse(parsed);
    if (!result.success) return fail(ERRORS.unclear, 422);
    if (result.data.status === "not_food") return fail(ERRORS.notFood, 422);
    if (result.data.status !== "ok") return fail(ERRORS.unclear, 422);

    const dishes = result.data.dishes.filter((d) => d.name.trim() !== "");
    if (dishes.length === 0) return fail(ERRORS.unclear, 422);

    return Response.json({ ok: true, dishes });
  } catch (error) {
    console.error("analyze-meal failed:", error);
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      return fail(ERRORS.timeout, 504);
    }
    if (isBusy(error)) return fail(ERRORS.busy, 503);
    if (error instanceof ApiError) {
      const keyRejected = error.status === 401 || error.status === 403 || /api key/i.test(error.message);
      if (keyRejected) return fail(ERRORS.badKey, 500);
    }
    return fail(ERRORS.other, 500);
  }
}
