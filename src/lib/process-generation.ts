import { prisma } from "./db";
import { AppError } from "./errors";
import { getMusicProvider, modelForMode } from "./provider";
import { audioKey, putAudio } from "./storage";

/**
 * Claims one queued generation atomically (SKIP LOCKED keeps multiple workers
 * safe) and renders it. Shared by the long-running worker and the cron route.
 */
export async function claimNextGeneration(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "Generation"
       SET status = 'PROCESSING',
           progress = 5,
           stage = 'Preparing your session',
           "startedAt" = now(),
           "updatedAt" = now()
     WHERE id = (
       SELECT id FROM "Generation"
        WHERE status = 'QUEUED'
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
     )
     RETURNING id
  `;

  return rows[0]?.id ?? null;
}

export async function renderGeneration(generationId: string) {
  const generation = await prisma.generation.findUnique({ where: { id: generationId } });
  if (!generation || generation.status !== "PROCESSING") return;

  const provider = getMusicProvider();
  const model = modelForMode(generation.mode);
  const startedAt = Date.now();

  const onProgress = async (progress: number, stage: string) => {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { progress: Math.max(5, Math.min(99, Math.round(progress))), stage },
    });
  };

  try {
    const result = await provider.generate(
      {
        mode: generation.mode,
        prompt: generation.prompt,
        lyrics: generation.lyrics,
        genre: generation.genre,
        mood: generation.mood,
        tempo: generation.tempo,
        duration: generation.duration,
      },
      onProgress,
    );

    const key = audioKey(generation.userId, generation.id, result.extension);
    await putAudio(key, result.audio);

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "SUCCEEDED",
        progress: 100,
        stage: "Ready to play",
        error: null,
        audioKey: key,
        audioMime: result.mime,
        audioBytes: result.audio.length,
        provider: result.provider,
        providerModel: result.model,
        providerJobId: result.providerJobId ?? null,
        completedAt: new Date(),
      },
    });

    await prisma.providerCall.create({
      data: {
        provider: result.provider,
        model: result.model,
        operation: "GENERATE",
        status: "SUCCEEDED",
        latencyMs: Date.now() - startedAt,
        userId: generation.userId,
        generationId: generation.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The generation could not be completed.";

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        stage: "Stopped",
        error: message.slice(0, 500),
        completedAt: new Date(),
      },
    });

    await prisma.providerCall.create({
      data: {
        provider: provider.name,
        model,
        operation: "GENERATE",
        status: "FAILED",
        latencyMs: Date.now() - startedAt,
        error: message.slice(0, 500),
        userId: generation.userId,
        generationId: generation.id,
      },
    });

    console.error(`[generation ${generation.id}] ${message}`);
  }
}

/** Renders at most one queued job. Returns true when work was done. */
export async function runNextGeneration(): Promise<boolean> {
  const id = await claimNextGeneration();
  if (!id) return false;
  await renderGeneration(id);
  return true;
}
