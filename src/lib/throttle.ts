/** Tiny in-memory throttle for auth endpoints (per process). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function throttle(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export function clientKey(request: Request, suffix: string) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "local";
  return `${forwarded.split(",")[0].trim()}:${suffix}`;
}
