// Shared Gemini setup for the AI routes. Server only: the key never reaches the phone.
import {
  ApiError,
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";

// Always the current stable Flash model: fast, reads images, cheap.
export const GEMINI_MODEL = "gemini-flash-latest";
// A lighter model to fall back to when the main one is overloaded.
const FALLBACK_MODEL = "gemini-flash-lite-latest";

// Busy (503) or rate-limited (429): worth trying again.
export const isBusy = (error: unknown) =>
  error instanceof ApiError && (error.status === 503 || error.status === 429);

export const isTimeout = (error: unknown) =>
  error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");

// Calls Gemini within `budgetMs`. The main model gets about 60% of the time;
// if it's busy or too slow, the lighter model gets the rest. Thinking is kept
// minimal: these are quick tasks, and thinking makes answers much slower.
export async function generateWithFallback(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, "model">,
  budgetMs: number,
): Promise<GenerateContentResponse> {
  const deadline = Date.now() + budgetMs;
  const config = { ...params.config, thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } };
  try {
    return await ai.models.generateContent({
      ...params,
      model: GEMINI_MODEL,
      config: { ...config, abortSignal: AbortSignal.timeout(Math.round(budgetMs * 0.6)) },
    });
  } catch (error) {
    if (!isBusy(error) && !isTimeout(error)) throw error;
    return ai.models.generateContent({
      ...params,
      model: FALLBACK_MODEL,
      config: { ...config, abortSignal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())) },
    });
  }
}

export type KeyProblem = "missing" | "malformed";

// The key from GEMINI_API_KEY, or what's wrong with it. A key copied from a
// shortened list view contains "…", which can't be sent, so catch that here.
export function geminiClient(): GoogleGenAI | KeyProblem {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "paste-your-key-here") return "missing";
  if (!/^[\x21-\x7e]+$/.test(apiKey)) return "malformed";
  return new GoogleGenAI({ apiKey });
}
