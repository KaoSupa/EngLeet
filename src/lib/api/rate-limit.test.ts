import { afterEach, describe, expect, it } from "vitest";

import { assertRateLimit, RateLimitError } from "./rate-limit";

const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("rate limit fallback", () => {
  afterEach(() => {
    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
  });

  it("blocks requests after the in-memory fallback limit", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key = `test:${crypto.randomUUID()}`;

    await expect(
      assertRateLimit({ key, limit: 1, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
    await expect(
      assertRateLimit({ key, limit: 1, windowMs: 60_000 }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});
