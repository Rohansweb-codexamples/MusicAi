import { AppError } from "../errors";
import type { GenerationResult, MusicProvider, ProgressFn, ProviderInput } from "./types";

/**
 * ElevenLabs Music API — returns the finished audio in the response body.
 * Enable with MUSIC_PROVIDER=elevenlabs and ELEVENLABS_API_KEY.
 */
export const elevenLabsProvider: MusicProvider = {
  name: "elevenlabs",

  async generate(input: ProviderInput, onProgress: ProgressFn): Promise<GenerationResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new AppError(
        503,
        "Music generation is not configured yet. Add ELEVENLABS_API_KEY on the server to enable real generation.",
      );
    }

    const model = process.env.ELEVENLABS_MUSIC_MODEL || "music_v1";
    const sections = [
      `${input.genre}, ${input.mood}`,
      input.tempo ? `${input.tempo} bpm` : "",
      input.mode === "INSTRUMENTAL"
        ? "Instrumental only, no vocals."
        : input.lyrics?.trim()
          ? `Vocals with these lyrics:\n${input.lyrics.trim()}`
          : "Instrumental only, no vocals.",
      input.prompt,
    ].filter(Boolean);

    await onProgress(25, "Composing with ElevenLabs");

    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: sections.join("\n\n"),
        music_length_ms: Math.min(input.duration, 300) * 1000,
        model_id: model,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const raw = await response.text();
      let detail = raw.slice(0, 300);
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.detail?.message ?? parsed?.detail ?? parsed?.message ?? detail;
      } catch {
        // keep raw text
      }
      throw new AppError(
        response.status === 429 ? 429 : 502,
        `The music provider rejected the request (${response.status}): ${detail}`,
      );
    }

    await onProgress(85, "Downloading your master");

    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length === 0) {
      throw new AppError(502, "The music provider returned an empty audio file.");
    }

    return {
      audio,
      mime: "audio/mpeg",
      extension: "mp3",
      provider: "elevenlabs",
      model,
    };
  },
};
