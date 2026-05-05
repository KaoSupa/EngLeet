import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api";
import { DASHBOARD_PROFILE_SELECT } from "@/lib/users/profile";

export async function GET() {
  const auth = await getApiUser();

  if (auth.response) {
    return auth.response;
  }

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
          ${DASHBOARD_PROFILE_SELECT}
        )
      `,
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load dashboard summary" },
      { status: 500 },
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

  return NextResponse.json({
    profile: profile ?? null,
    stats,
  });
}
