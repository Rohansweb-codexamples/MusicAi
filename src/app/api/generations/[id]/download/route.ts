import { requireUser } from "@/lib/auth";
import { audioResponse } from "@/lib/audio-response";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail } from "@/lib/http";
import { getAudio } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id },
      select: {
        userId: true,
        audioKey: true,
        audioMime: true,
        status: true,
        title: true,
      },
    });

    if (!generation || generation.userId !== user.id) {
      throw new AppError(404, "Track not found.");
    }
    if (generation.status !== "SUCCEEDED" || !generation.audioKey) {
      throw new AppError(409, "This track does not have audio yet.");
    }

    const buffer = await getAudio(generation.audioKey);
    if (!buffer) {
      throw new AppError(404, "The audio file for this track is no longer available.");
    }

    const extension = generation.audioKey.split(".").pop() || "mp3";
    const filename = `${generation.title}.${extension}`;

    return audioResponse(buffer, generation.audioMime || "audio/mpeg", request, filename);
  } catch (error) {
    return fail(error);
  }
}
