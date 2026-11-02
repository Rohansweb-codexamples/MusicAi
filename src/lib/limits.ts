import { AppError } from "./errors";
import { prisma } from "./db";
import { LIMITS } from "./constants";

/**
 * Users have unlimited application credits, but the installation still needs
 * guard rails so one account cannot exhaust the provider account:
 *  - a cap on simultaneously rendering tracks
 *  - an hourly generation cap
 *  - a site-wide 24h ceiling on requested audio seconds
 */
export async function assertGenerationAllowed(userId: string, duration: number) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [active, lastHour, lastDay] = await Promise.all([
    prisma.generation.count({
      where: { userId, status: { in: ["QUEUED", "PROCESSING"] } },
    }),
    prisma.generation.count({
      where: { userId, createdAt: { gte: hourAgo } },
    }),
    prisma.generation.aggregate({
      where: {
        createdAt: { gte: dayAgo },
        status: { in: ["QUEUED", "PROCESSING", "SUCCEEDED"] },
      },
      _sum: { duration: true },
    }),
  ]);

  if (active >= LIMITS.maxActive) {
    throw new AppError(
      429,
      `You already have ${active} tracks rendering. Wait for one to finish before starting another.`,
    );
  }

  if (lastHour >= LIMITS.perHour) {
    throw new AppError(
      429,
      `You've reached ${LIMITS.perHour} generations in the last hour. Please try again shortly.`,
    );
  }

  const usedSeconds = lastDay._sum.duration ?? 0;
  if (usedSeconds + duration > LIMITS.dailyProviderSeconds) {
    throw new AppError(
      429,
      "The studio has reached its 24-hour generation capacity. Please try again later.",
    );
  }
}
