import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";
import { toTrack } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    const [tracks, saved, active, recent, succeeded] = await Promise.all([
      prisma.generation.count({ where: { userId: user.id } }),
      prisma.generation.count({ where: { userId: user.id, isSaved: true } }),
      prisma.generation.count({
        where: { userId: user.id, status: { in: ["QUEUED", "PROCESSING"] } },
      }),
      prisma.generation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.generation.findMany({
        where: { userId: user.id, status: "SUCCEEDED" },
        select: { duration: true, genre: true },
      }),
    ]);

    const seconds = succeeded.reduce((total, track) => total + track.duration, 0);
    const genreCounts = succeeded.reduce<Record<string, number>>((acc, track) => {
      acc[track.genre] = (acc[track.genre] ?? 0) + 1;
      return acc;
    }, {});
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([genre, count]) => ({ genre, count }));

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt.toISOString(),
      },
      totals: {
        tracks,
        saved,
        active,
        minutes: Math.round((seconds / 60) * 10) / 10,
      },
      topGenres,
      recent: recent.map(toTrack),
    });
  } catch (error) {
    return fail(error);
  }
}
