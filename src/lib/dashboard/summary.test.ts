import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getDashboardSummary } from "./summary";
import type { Database } from "@/types/supabase";

describe("getDashboardSummary", () => {
  it("reads only the user_stats read model", async () => {
    const queriedTables: string[] = [];
    const supabase = {
      from(table: string) {
        queriedTables.push(table);
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: {
                        total_xp: 100,
                        level: 2,
                        current_streak: 1,
                        lessons_completed: 3,
                        quizzes_completed: 4,
                        vocab_mastered: 5,
                        total_study_time_seconds: 600,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient<Database>;

    const { summary, error } = await getDashboardSummary(supabase, "user-1");

    expect(error).toBeNull();
    expect(summary.stats.vocab_mastered).toBe(5);
    expect(queriedTables).toEqual(["user_stats"]);
  });
});
