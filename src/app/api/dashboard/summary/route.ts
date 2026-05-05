import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api";

const ROUTE_VERSION = "dashboard-summary-single-query-v2";

function timingMs(start: number) {
  return Math.max(0, Math.round(performance.now() - start));
}

function timingHeader(timings: Record<string, number>) {
  return Object.entries(timings)
    .map(([name, value]) => `${name};dur=${value}`)
    .join(", ");
}

export async function GET() {
  const totalStart = performance.now();
  const authStart = performance.now();
  const auth = await getApiUser();
  const authMs = timingMs(authStart);

  if (auth.response) {
    auth.response.headers.set(
      "Server-Timing",
      timingHeader({ auth: authMs, total: timingMs(totalStart) }),
    );
    auth.response.headers.set("Cache-Control", "private, no-store");
    auth.response.headers.set("x-engleet-route-version", ROUTE_VERSION);
    return auth.response;
  }

  const queryStart = performance.now();
  const { data, error } = await auth.supabase
    .from("user_stats")
    .select(
      `
        total_xp,
        level,
        current_streak,
        lessons_completed,
        quizzes_completed,
        vocab_mastered,
        profiles!inner (
          display_name,
          username,
          role,
          preferred_cefr_level
        )
      `,
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();
  const queryMs = timingMs(queryStart);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load dashboard summary" },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": timingHeader({
            auth: authMs,
            query: queryMs,
            total: timingMs(totalStart),
          }),
          "x-engleet-route-version": ROUTE_VERSION,
        },
      },
    );
  }

  const profile = Array.isArray(data?.profiles)
    ? data.profiles[0]
    : data?.profiles;
  const stats = data
    ? {
        total_xp: data.total_xp,
        level: data.level,
        current_streak: data.current_streak,
        lessons_completed: data.lessons_completed,
        quizzes_completed: data.quizzes_completed,
        vocab_mastered: data.vocab_mastered,
      }
    : null;

  return NextResponse.json(
    {
      profile: profile ?? null,
      stats,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Server-Timing": timingHeader({
          auth: authMs,
          query: queryMs,
          total: timingMs(totalStart),
        }),
        "x-engleet-route-version": ROUTE_VERSION,
      },
    },
  );
}
