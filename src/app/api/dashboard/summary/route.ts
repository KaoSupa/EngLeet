import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api";

export async function GET() {
  const auth = await getApiUser();

  if (auth.response) {
    return auth.response;
  }

  const [{ data: profile, error: profileError }, { data: stats, error: statsError }] =
    await Promise.all([
      auth.supabase
        .from("profiles")
        .select("display_name, username, role, preferred_cefr_level")
        .eq("id", auth.user.id)
        .maybeSingle(),
      auth.supabase
        .from("user_stats")
        .select(
          "total_xp, level, current_streak, lessons_completed, quizzes_completed, vocab_mastered",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle(),
    ]);

  if (profileError || statsError) {
    return NextResponse.json(
      { error: "Unable to load dashboard summary" },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile, stats });
}
