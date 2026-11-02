import type { GenerationMode } from "@prisma/client";

export type ProviderInput = {
  mode: GenerationMode;
  prompt: string;
  lyrics?: string | null;
  genre: string;
  mood: string;
  tempo?: number | null;
  duration: number;
};

export type ProgressFn = (progress: number, stage: string) => Promise<void> | void;

export type GenerationResult = {
  audio: Buffer;
  mime: string;
  extension: string;
  provider: string;
  model: string;
  providerJobId?: string;
};

export interface MusicProvider {
  name: string;
  generate(input: ProviderInput, onProgress: ProgressFn): Promise<GenerationResult>;
}
