import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { DashboardProfileSummary } from "@/lib/users/profile";
import type { Database } from "@/types/supabase";

type UserStatsRow = Database["public"]["Tables"]["user_stats"]["Row"];

export type DashboardStatsSummary = Pick<
  UserStatsRow,
  | "total_xp"
  | "level"
  | "current_streak"
  | "lessons_completed"
  | "quizzes_completed"
  | "vocab_mastered"
  | "total_study_time_seconds"
>;

export type DashboardSummaryData = {
  profile: DashboardProfileSummary | null;
  stats: DashboardStatsSummary;
};

export const EMPTY_DASHBOARD_STATS: DashboardStatsSummary = {
  total_xp: 0,
  level: 1,
  current_streak: 0,
  lessons_completed: 0,
  quizzes_completed: 0,
  vocab_mastered: 0,
  total_study_time_seconds: 0,
};

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummaryData = {
  profile: null,
  stats: EMPTY_DASHBOARD_STATS,
};

function toDashboardStats(data: DashboardStatsSummary | null) {
  if (!data) {
    return EMPTY_DASHBOARD_STATS;
  }

  return {
    total_xp: data.total_xp ?? 0,
    level: data.level ?? 1,
    current_streak: data.current_streak ?? 0,
    lessons_completed: data.lessons_completed ?? 0,
    quizzes_completed: data.quizzes_completed ?? 0,
    vocab_mastered: data.vocab_mastered ?? 0,
    total_study_time_seconds: data.total_study_time_seconds ?? 0,
  };
}

export async function getDashboardSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{
  summary: DashboardSummaryData;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("user_stats")
    .select(
      `
        total_xp,
        level,
        current_streak,
        lessons_completed,
        quizzes_completed,
        vocab_mastered,
        total_study_time_seconds
      `,
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      summary: EMPTY_DASHBOARD_SUMMARY,
      error,
    };
  }

  return {
    summary: {
      profile: null,
      stats: toDashboardStats(data),
    },
    error: null,
  };
}
