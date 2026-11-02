import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json, readJson } from "@/lib/http";
import { toTrack } from "@/lib/serialize";
import { removeAudio } from "@/lib/storage";
import { updateGenerationSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function ownedGeneration(userId: string, id: string) {
  const generation = await prisma.generation.findUnique({ where: { id } });
  // Private by default: another user's track is indistinguishable from a missing one.
  if (!generation || generation.userId !== userId) {
    throw new AppError(404, "Track not found.");
  }
  return generation;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return json({ track: toTrack(await ownedGeneration(user.id, id)) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const generation = await ownedGeneration(user.id, id);
    const body = updateGenerationSchema.parse(await readJson(request));

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.isSaved !== undefined ? { isSaved: body.isSaved } : {}),
      },
    });

    return json({ track: toTrack(updated) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const generation = await ownedGeneration(user.id, id);

    if (generation.audioKey) await removeAudio(generation.audioKey);
    await prisma.generation.delete({ where: { id: generation.id } });

    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
