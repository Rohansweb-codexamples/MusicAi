import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json } from "@/lib/http";
import { assertGenerationAllowed } from "@/lib/limits";
import { toTrack } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

/** Re-queues the same settings as a brand new generation. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const source = await prisma.generation.findUnique({ where: { id } });
    if (!source || source.userId !== user.id) {
      throw new AppError(404, "Track not found.");
    }

    await assertGenerationAllowed(user.id, source.duration);

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        title: source.title,
        mode: source.mode,
        prompt: source.prompt,
        lyrics: source.lyrics,
        genre: source.genre,
        mood: source.mood,
        tempo: source.tempo,
        duration: source.duration,
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
