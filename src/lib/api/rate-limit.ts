"server-only";

import { createServiceClient } from "@/lib/supabase/service";

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

function assertMemoryRateLimit({
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

export async function assertRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    assertMemoryRateLimit({ key, limit, windowMs });
    return;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("server_take_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });

  if (error) {
    throw new Error("Rate limit check failed");
  }

  const result = data?.[0];

  if (!result?.allowed) {
    throw new RateLimitError(
      "Too many requests. Please wait before trying again.",
      result?.retry_after_seconds ?? 1,
    );
  }
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
