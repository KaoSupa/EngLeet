type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function assertRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= limit) {
    throw new RateLimitError(
      "Too many requests. Please wait before trying again.",
      Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    );
  }

  existing.count += 1;
}

export function getRateLimitIdentity({
  prefix,
  userId,
}: {
  prefix: string;
  userId: string;
}) {
  return `${prefix}:${userId}`;
}
