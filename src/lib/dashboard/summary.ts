import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  DASHBOARD_PROFILE_SELECT,
  type DashboardProfileSummary,
} from "@/lib/users/profile";
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
>;

export type DashboardSummaryData = {
  profile: DashboardProfileSummary | null;
  stats: DashboardStatsSummary | null;
};

type DashboardSummaryRow = DashboardStatsSummary & {
  profiles: DashboardProfileSummary | DashboardProfileSummary[] | null;
};

const EMPTY_DASHBOARD_SUMMARY: DashboardSummaryData = {
  profile: null,
  stats: null,
};

function normalizeProfile(
  profile: DashboardSummaryRow["profiles"],
): DashboardProfileSummary | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }

  return profile;
}

function toDashboardSummary(
  data: DashboardSummaryRow | null,
): DashboardSummaryData {
  if (!data) {
    return EMPTY_DASHBOARD_SUMMARY;
  }

  return {
    profile: normalizeProfile(data.profiles),
    stats: {
      total_xp: data.total_xp,
      level: data.level,
      current_streak: data.current_streak,
      lessons_completed: data.lessons_completed,
      quizzes_completed: data.quizzes_completed,
      vocab_mastered: data.vocab_mastered,
    },
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
        profiles!inner (
          ${DASHBOARD_PROFILE_SELECT}
        )
      `,
    )
    .eq("user_id", userId)
    .maybeSingle();

  return {
    summary: error
      ? EMPTY_DASHBOARD_SUMMARY
      : toDashboardSummary(data as DashboardSummaryRow | null),
    error,
  };
}
