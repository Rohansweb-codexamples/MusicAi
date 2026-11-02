import type { GenerationMode } from "@prisma/client";
import { elevenLabsProvider } from "./elevenlabs";
import { modelFor, replicateProvider } from "./replicate";
import type { MusicProvider } from "./types";

export function providerName() {
  return (process.env.MUSIC_PROVIDER || "replicate").toLowerCase() === "elevenlabs"
    ? "elevenlabs"
    : "replicate";
}

export function getMusicProvider(): MusicProvider {
  return providerName() === "elevenlabs" ? elevenLabsProvider : replicateProvider;
}

export function modelForMode(mode: GenerationMode) {
  return providerName() === "elevenlabs"
    ? process.env.ELEVENLABS_MUSIC_MODEL || "music_v1"
    : modelFor(mode);
}

/** Status only — never exposes a key value. */
export function providerStatus() {
  const name = providerName();
  return {
    name,
    configured:
      name === "elevenlabs"
        ? Boolean(process.env.ELEVENLABS_API_KEY)
        : Boolean(process.env.REPLICATE_API_TOKEN),
    vocalsModel:
      name === "elevenlabs"
        ? process.env.ELEVENLABS_MUSIC_MODEL || "music_v1"
        : process.env.REPLICATE_MUSIC_MODEL_VOCAL || "lucataco/ace-step",
    instrumentalModel:
      name === "elevenlabs"
        ? process.env.ELEVENLABS_MUSIC_MODEL || "music_v1"
        : process.env.REPLICATE_MUSIC_MODEL_INSTRUMENTAL || "lucataco/ace-step",
    lyricsWriterConfigured: Boolean(process.env.LLM_API_KEY),
  };
}

export type { MusicProvider } from "./types";
