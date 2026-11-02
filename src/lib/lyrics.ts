import { prisma } from "./db";
import { AppError } from "./errors";

const SYSTEM_PROMPT = `You are a professional songwriter. Write original, singable lyrics.
Return only the lyrics, using [verse], [chorus], [bridge] and [outro] section tags on their own lines.
Keep 6-10 syllables per line, keep rhymes consistent, and match the requested genre and mood.
Never include explanations, titles or markdown.`;

/**
 * AI lyrics writer. Uses any OpenAI-compatible chat completions endpoint,
 * configured entirely server-side (LLM_BASE_URL, LLM_MODEL, LLM_API_KEY).
 */
export async function writeLyrics(input: { prompt: string; genre: string; mood: string }) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "The AI lyrics writer is not configured. Add LLM_API_KEY on the server, or write your own lyrics.",
    );
  }

  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Genre: ${input.genre}\nMood: ${input.mood}\nSong idea: ${input.prompt}`,
          },
        ],
      }),
      cache: "no-store",
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new AppError(
        response.status === 429 ? 429 : 502,
        `The lyrics service rejected the request (${response.status}): ${raw.slice(0, 200)}`,
      );
    }

    const body = JSON.parse(raw);
    const lyrics: string = body?.choices?.[0]?.message?.content ?? "";
    if (!lyrics.trim()) {
      throw new AppError(502, "The lyrics service returned an empty draft. Try again.");
    }

    await prisma.providerCall.create({
      data: {
        provider: "llm",
        model,
        operation: "LYRICS",
        status: "SUCCEEDED",
        latencyMs: Date.now() - startedAt,
      },
    });

    return lyrics.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lyrics generation failed";
    await prisma.providerCall.create({
      data: {
        provider: "llm",
        model,
        operation: "LYRICS",
        status: "FAILED",
        latencyMs: Date.now() - startedAt,
        error: message.slice(0, 500),
      },
    });
    throw error;
  }
}
