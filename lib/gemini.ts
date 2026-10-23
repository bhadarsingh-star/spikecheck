// Shared Gemini setup for the AI routes. Server only: the key never reaches the phone.
import { ApiError, GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";

// Always the current stable Flash model: fast, reads images, cheap.
export const GEMINI_MODEL = "gemini-flash-latest";
// A lighter model to fall back to when the main one is overloaded.
const FALLBACK_MODEL = "gemini-flash-lite-latest";

// Busy (503) or rate-limited (429): worth trying again.
export const isBusy = (error: unknown) =>
  error instanceof ApiError && (error.status === 503 || error.status === 429);

// Calls Gemini; when it's busy, waits a moment and retries once, then tries the lighter model.
export async function generateWithFallback(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, "model">,
): Promise<GenerateContentResponse> {
  const attempts = [GEMINI_MODEL, GEMINI_MODEL, FALLBACK_MODEL];
  for (let i = 0; ; i++) {
    try {
      return await ai.models.generateContent({ ...params, model: attempts[i] });
    } catch (error) {
      if (!isBusy(error) || i === attempts.length - 1) throw error;
      if (i === 0) await new Promise((resolve) => setTimeout(resolve, 800));
    }
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

// Gives up on a request after `ms`, so the user isn't left waiting.
export const timeLimit = (ms: number) => AbortSignal.timeout(ms);
