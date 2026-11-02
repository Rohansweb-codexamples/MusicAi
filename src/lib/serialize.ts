import type { Generation } from "@prisma/client";
import type { TrackDTO } from "./types";

export function toTrack(generation: Generation): TrackDTO {
  return {
    id: generation.id,
    title: generation.title,
    mode: generation.mode,
    prompt: generation.prompt,
    lyrics: generation.lyrics,
    genre: generation.genre,
    mood: generation.mood,
    tempo: generation.tempo,
    duration: generation.duration,
    status: generation.status,
    progress: generation.progress,
    stage: generation.stage,
    error: generation.error,
    isSaved: generation.isSaved,
    provider: generation.provider,
    providerModel: generation.providerModel,
    audioBytes: generation.audioBytes,
    audioUrl:
      generation.status === "SUCCEEDED" && generation.audioKey
        ? `/api/generations/${generation.id}/audio`
        : null,
    createdAt: generation.createdAt.toISOString(),
    completedAt: generation.completedAt ? generation.completedAt.toISOString() : null,
  };
}

export function titleFromPrompt(prompt: string) {
  const words = prompt
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) return "Untitled track";
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}
