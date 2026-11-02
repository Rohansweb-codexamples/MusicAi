export type GenerationMode = "TEXT_TO_MUSIC" | "SONG_WITH_VOCALS" | "INSTRUMENTAL";
export type GenerationStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export type TrackDTO = {
  id: string;
  title: string;
  mode: GenerationMode;
  prompt: string;
  lyrics: string | null;
  genre: string;
  mood: string;
  tempo: number | null;
  duration: number;
  status: GenerationStatus;
  progress: number;
  stage: string | null;
  error: string | null;
  isSaved: boolean;
  provider: string | null;
  providerModel: string | null;
  audioBytes: number | null;
  audioUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  joinedAt?: string;
};
