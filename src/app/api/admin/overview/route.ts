import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, json } from "@/lib/http";
import { LIMITS } from "@/lib/constants";
import { providerStatus } from "@/lib/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      users,
      userList,
      totalTracks,
      activeJobs,
      todayTracks,
      succeededAgg,
      failedCount,
      calls24h,
      failedCalls24h,
      recentFailures,
      recentTracks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { generations: true } },
        },
      }),
      prisma.generation.count(),
      prisma.generation.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
      prisma.generation.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.generation.aggregate({
        where: { status: "SUCCEEDED", createdAt: { gte: dayAgo } },
        _sum: { duration: true },
        _count: true,
      }),
      prisma.generation.count({ where: { status: "FAILED", createdAt: { gte: dayAgo } } }),
      prisma.providerCall.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.providerCall.count({
        where: { createdAt: { gte: dayAgo }, status: "FAILED" },
      }),
      prisma.generation.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          error: true,
          createdAt: true,
          providerModel: true,
          user: { select: { email: true } },
        },
      }),
      prisma.generation.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          genre: true,
          duration: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

    const usedSeconds = succeededAgg._sum.duration ?? 0;

    return json({
      provider: providerStatus(),
      limits: {
        maxActive: LIMITS.maxActive,
        perHour: LIMITS.perHour,
        dailyProviderSeconds: LIMITS.dailyProviderSeconds,
        maxDurationSeconds: LIMITS.maxDurationSeconds,
      },
      totals: {
        users,
        tracks: totalTracks,
        activeJobs,
        tracks24h: todayTracks,
        succeeded24h: succeededAgg._count,
        failed24h: failedCount,
        seconds24h: usedSeconds,
        minutes24h: Math.round((usedSeconds / 60) * 10) / 10,
        calls24h,
        failedCalls24h,
        errorRate: calls24h === 0 ? 0 : Math.round((failedCalls24h / calls24h) * 1000) / 10,
      },
      users: userList.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tracks: user._count.generations,
        createdAt: user.createdAt.toISOString(),
      })),
      recentFailures: recentFailures.map((track) => ({
        ...track,
        createdAt: track.createdAt.toISOString(),
      })),
      recentTracks: recentTracks.map((track) => ({
        ...track,
        createdAt: track.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
