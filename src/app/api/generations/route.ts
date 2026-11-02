import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json, readJson } from "@/lib/http";
import { assertGenerationAllowed } from "@/lib/limits";
import { titleFromPrompt, toTrack } from "@/lib/serialize";
import { createGenerationSchema } from "@/lib/validation";
import type { GenerationStatus, Prisma } from "@prisma/client";

const STATUS_VALUES: GenerationStatus[] = [
  "QUEUED",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
];

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 100);
    const saved = url.searchParams.get("saved");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("q")?.trim();

    const where: Prisma.GenerationWhereInput = { userId: user.id };
    if (saved === "true") where.isSaved = true;
    if (status && STATUS_VALUES.includes(status as GenerationStatus)) {
      where.status = status as GenerationStatus;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { prompt: { contains: search, mode: "insensitive" } },
        { genre: { contains: search, mode: "insensitive" } },
      ];
    }

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return json({ tracks: generations.map(toTrack) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createGenerationSchema.parse(await readJson(request));

    if (body.mode === "SONG_WITH_VOCALS" && !body.lyrics?.trim()) {
      throw new AppError(
        400,
        "Add lyrics — or write them with the AI lyrics writer — before generating a song with vocals.",
      );
    }

    await assertGenerationAllowed(user.id, body.duration);

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        title: body.title?.trim() || titleFromPrompt(body.prompt),
        mode: body.mode,
        prompt: body.prompt,
        lyrics: body.mode === "INSTRUMENTAL" ? null : body.lyrics?.trim() || null,
        genre: body.genre,
        mood: body.mood,
        tempo: body.tempo ?? null,
        duration: body.duration,
        status: "QUEUED",
        progress: 2,
        stage: "Queued",
      },
    });

    return json({ track: toTrack(generation) }, 201);
  } catch (error) {
    return fail(error);
  }
}
