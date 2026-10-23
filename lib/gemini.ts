// Shared Gemini setup for the AI routes. Server only: the key never reaches the phone.
import { GoogleGenAI } from "@google/genai";

// Always the current stable Flash model: fast, reads images, cheap.
export const GEMINI_MODEL = "gemini-flash-latest";

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
