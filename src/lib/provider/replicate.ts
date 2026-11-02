import type { GenerationMode } from "@prisma/client";
import { AppError } from "../errors";
import type { GenerationResult, MusicProvider, ProgressFn, ProviderInput } from "./types";

const API_BASE = process.env.REPLICATE_API_BASE || "https://api.replicate.com/v1";
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

const versionCache = new Map<string, { id: string; expiresAt: number }>();

function token() {
  const value = process.env.REPLICATE_API_TOKEN;
  if (!value) {
    throw new AppError(
      503,
      "Music generation is not configured yet. Add REPLICATE_API_TOKEN on the server to enable real generation.",
    );
  }
  return value;
}

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();
  let body: any = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      body?.detail ?? body?.title ?? body?.error ?? raw.slice(0, 300) ?? response.statusText;
    throw new AppError(
      response.status === 429 ? 429 : 502,
      `The music provider rejected the request (${response.status}): ${detail}`,
    );
  }

  return body;
}

async function versionFor(model: string) {
  const cached = versionCache.get(model);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const modelInfo = await call(`/models/${model}`);
  const version = modelInfo?.latest_version?.id;
  if (!version) {
    throw new AppError(502, `The configured provider model "${model}" has no published version.`);
  }

  versionCache.set(model, { id: version, expiresAt: Date.now() + MODEL_CACHE_TTL_MS });
  return version;
}

export function modelFor(mode: GenerationMode) {
  return mode === "INSTRUMENTAL"
    ? process.env.REPLICATE_MUSIC_MODEL_INSTRUMENTAL || "lucataco/ace-step"
    : process.env.REPLICATE_MUSIC_MODEL_VOCAL || "lucataco/ace-step";
}

/** Musical brief handed to the model: genre, mood, tempo and the user's words. */
function brief(input: ProviderInput) {
  const parts: string[] = [input.genre, input.mood];
  if (input.tempo) parts.push(`${input.tempo} bpm`);
  if (input.mode === "INSTRUMENTAL") parts.push("instrumental", "no vocals");
  parts.push(input.prompt);
  return parts.filter(Boolean).join(", ");
}

function buildInput(model: string, input: ProviderInput) {
  const instrumental = input.mode === "INSTRUMENTAL";
  const lyrics = instrumental
    ? "[instrumental]"
    : input.lyrics?.trim() || "[instrumental]";

  // Meta MusicGen accepts a single prompt; ACE-Step takes tags + lyrics.
  if (model.includes("musicgen")) {
    return {
      prompt: brief(input),
      duration: input.duration,
      model_version: "stereo-large",
      output_format: "mp3",
      normalization: true,
    };
  }

  return {
    tags: brief(input),
    lyrics,
    duration: input.duration,
    seed: -1,
  };
}

function pickOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const last = [...output].reverse().find((item) => typeof item === "string");
    return typeof last === "string" ? last : null;
  }
  if (output && typeof output === "object") {
    const value = Object.values(output as Record<string, unknown>).find(
      (item) => typeof item === "string" && /^https?:/.test(item as string),
    );
    return typeof value === "string" ? value : null;
  }
  return null;
}

function audioMeta(contentType: string | null, url: string) {
  const type = (contentType ?? "").toLowerCase();
  if (type.includes("wav")) return { mime: "audio/wav", extension: "wav" };
  if (type.includes("ogg")) return { mime: "audio/ogg", extension: "ogg" };
  if (type.includes("flac")) return { mime: "audio/flac", extension: "flac" };
  if (type.includes("mp4") || type.includes("m4a")) return { mime: "audio/mp4", extension: "m4a" };
  if (type.includes("mpeg") || type.includes("mp3")) return { mime: "audio/mpeg", extension: "mp3" };

  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".wav")) return { mime: "audio/wav", extension: "wav" };
  if (path.endsWith(".ogg")) return { mime: "audio/ogg", extension: "ogg" };
  if (path.endsWith(".flac")) return { mime: "audio/flac", extension: "flac" };
  if (path.endsWith(".m4a")) return { mime: "audio/mp4", extension: "m4a" };
  return { mime: "audio/mpeg", extension: "mp3" };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const replicateProvider: MusicProvider = {
  name: "replicate",

  async generate(input: ProviderInput, onProgress: ProgressFn): Promise<GenerationResult> {
    const model = modelFor(input.mode);
    const version = await versionFor(model);

    await onProgress(12, "Sending your brief to the model");

    const prediction = await call("/predictions", {
      method: "POST",
      body: JSON.stringify({ version, input: buildInput(model, input) }),
    });

    const predictionId: string = prediction.id;
    const deadline = Date.now() + 10 * 60 * 1000;
    const startedAt = Date.now();
    let current = prediction;

    while (Date.now() < deadline) {
      await sleep(3000);
      current = await call(`/predictions/${predictionId}`);

      const logs: string[] =
        typeof current.logs === "string"
          ? current.logs.split("\n").map((line: string) => line.trim()).filter(Boolean)
          : [];
      const stage = logs.length ? logs[logs.length - 1].slice(0, 140) : "Composing audio";
      const ratio = Math.min(1, (Date.now() - startedAt) / (90 * 1000));
      await onProgress(Math.min(92, 20 + Math.round(ratio * 70)), stage);

      if (current.status === "succeeded") break;
      if (current.status === "failed" || current.status === "canceled") {
        throw new AppError(
          502,
          current.error
            ? `The music provider failed: ${String(current.error).slice(0, 300)}`
            : "The music provider could not finish this track.",
        );
      }
    }

    if (current.status !== "succeeded") {
      throw new AppError(504, "The music provider took too long to finish. Try a shorter duration.");
    }

    const outputUrl = pickOutput(current.output);
    if (!outputUrl) {
      throw new AppError(502, "The music provider returned no audio for this track.");
    }

    await onProgress(94, "Downloading your master");

    const audioResponse = await fetch(outputUrl, { cache: "no-store" });
    if (!audioResponse.ok) {
      throw new AppError(502, `Could not download the generated audio (${audioResponse.status}).`);
    }

    const audio = Buffer.from(await audioResponse.arrayBuffer());
    if (audio.length === 0) {
      throw new AppError(502, "The music provider returned an empty audio file.");
    }

    const meta = audioMeta(audioResponse.headers.get("content-type"), outputUrl);

    return {
      audio,
      mime: meta.mime,
      extension: meta.extension,
      provider: "replicate",
      model,
      providerJobId: predictionId,
    };
  },
};
