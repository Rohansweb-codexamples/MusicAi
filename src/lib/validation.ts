import { z } from "zod";
import { DURATIONS, GENRES, MAX_TEMPO, MIN_TEMPO, MOODS } from "./constants";

const prompt = z
  .string()
  .trim()
  .min(6, "Describe the music in at least a few words.")
  .max(600, "Keep the description under 600 characters.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const createGenerationSchema = z.object({
  mode: z.enum(["TEXT_TO_MUSIC", "SONG_WITH_VOCALS", "INSTRUMENTAL"]),
  prompt,
  lyrics: z.string().trim().max(4000).optional().nullable(),
  genre: z.enum(GENRES),
  mood: z.enum(MOODS),
  tempo: z.number().int().min(MIN_TEMPO).max(MAX_TEMPO).optional().nullable(),
  duration: z
    .number()
    .int()
    .refine((value) => (DURATIONS as readonly number[]).includes(value), {
      message: "Choose a supported duration.",
    }),
  title: z.string().trim().max(80).optional(),
});

export const updateGenerationSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  isSaved: z.boolean().optional(),
});

export const lyricsSchema = z.object({
  prompt,
  genre: z.enum(GENRES),
  mood: z.enum(MOODS),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
