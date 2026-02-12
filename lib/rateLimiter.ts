const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) || []).filter((ts) => ts > cutoff);

  if (hits.length >= limit) {
    const earliestHit = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((earliestHit + windowMs - now) / 1000));
    buckets.set(key, hits);
    return { allowed: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}
