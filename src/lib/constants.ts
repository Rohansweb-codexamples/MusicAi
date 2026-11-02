export const GENRES = [
  "Pop",
  "Hip Hop",
  "Electronic",
  "Rock",
  "R&B",
  "Jazz",
  "Lo-Fi",
  "Cinematic",
  "Ambient",
  "Country",
  "Latin",
  "Afrobeats",
  "Classical",
  "Folk",
] as const;

export const MOODS = [
  "Uplifting",
  "Energetic",
  "Dreamy",
  "Melancholic",
  "Dark",
  "Romantic",
  "Nostalgic",
  "Epic",
  "Relaxed",
  "Playful",
] as const;

export const DURATIONS = [30, 60, 90, 120] as const;

export const MODE_LABELS = {
  TEXT_TO_MUSIC: "Text to music",
  SONG_WITH_VOCALS: "Song with vocals",
  INSTRUMENTAL: "Instrumental",
} as const;

export const MIN_TEMPO = 60;
export const MAX_TEMPO = 180;

function numeric(name: string, fallback: number) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

/** Server-enforced fair-use limits. Users have unlimited app credits. */
export const LIMITS = {
  get maxActive() {
    return numeric("GENERATION_MAX_ACTIVE", 3);
  },
  get perHour() {
    return numeric("GENERATION_HOURLY_LIMIT", 20);
  },
  get dailyProviderSeconds() {
    return numeric("PROVIDER_DAILY_SECONDS_CAP", 7200);
  },
  maxDurationSeconds: 120,
  minPasswordLength: 8,
};
