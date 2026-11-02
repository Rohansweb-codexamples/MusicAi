import type { GenerationMode } from "@prisma/client";
import { elevenLabsProvider } from "./elevenlabs";
import { lyriaProvider } from "./lyria";
import { modelFor, replicateProvider } from "./replicate";
import type { MusicProvider } from "./types";

export function providerName() {
  const configured = (process.env.MUSIC_PROVIDER || "lyria").toLowerCase();
  if (configured === "elevenlabs") return "elevenlabs";
  if (configured === "replicate") return "replicate";
  return "lyria";
}

export function getMusicProvider(): MusicProvider {
  const name = providerName();
  if (name === "elevenlabs") return elevenLabsProvider;
  if (name === "replicate") return replicateProvider;
  return lyriaProvider;
}

export function modelForMode(mode: GenerationMode) {
  const name = providerName();
  if (name === "elevenlabs") return process.env.ELEVENLABS_MUSIC_MODEL || "music_v1";
  if (name === "replicate") return modelFor(mode);
  return "lyria-3-pro-preview";
}

/** Status only — never exposes a key or service-account value. */
export function providerStatus() {
  const name = providerName();
  return {
    name,
    configured:
      name === "elevenlabs"
        ? Boolean(process.env.ELEVENLABS_API_KEY)
        : name === "replicate"
          ? Boolean(process.env.REPLICATE_API_TOKEN)
          : Boolean(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON && (process.env.GOOGLE_CLOUD_PROJECT_ID || (() => {
              try {
                return JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON || "{}").project_id;
              } catch {
                return false;
              }
            })())),
    vocalsModel:
      name === "elevenlabs"
        ? process.env.ELEVENLABS_MUSIC_MODEL || "music_v1"
        : name === "replicate"
          ? process.env.REPLICATE_MUSIC_MODEL_VOCAL || "lucataco/ace-step"
          : "lyria-3-pro-preview",
    instrumentalModel:
      name === "elevenlabs"
        ? process.env.ELEVENLABS_MUSIC_MODEL || "music_v1"
        : name === "replicate"
          ? process.env.REPLICATE_MUSIC_MODEL_INSTRUMENTAL || "lucataco/ace-step"
          : "lyria-3-pro-preview",
    lyricsWriterConfigured: Boolean(process.env.LLM_API_KEY),
  };
}

export type { MusicProvider } from "./types";
