import { describe, expect, it } from "vitest";

import {
  createDashboardStats,
  formatStudyTime,
  getLevelProgress,
} from "./dashboard-summary.utils";
import type { DashboardStatsSummary } from "./summary";

describe("dashboard summary utils", () => {
  it("formats study time for dashboard cards", () => {
    expect(formatStudyTime(0)).toBe("0m");
    expect(formatStudyTime(60)).toBe("1m");
    expect(formatStudyTime(3600)).toBe("1h");
    expect(formatStudyTime(3660)).toBe("1h 1m");
  });

  it("calculates bounded level progress", () => {
    expect(getLevelProgress(0)).toEqual({
      currentXp: 0,
      requiredXp: 100,
      percent: 0,
    });
    expect(getLevelProgress(50).percent).toBe(50);
    expect(getLevelProgress(-100).percent).toBe(0);
  });

  it("creates stable dashboard stat cards", () => {
    const stats: DashboardStatsSummary = {
      total_xp: 120,
      level: 2,
      current_streak: 3,
      lessons_completed: 4,
      quizzes_completed: 5,
      vocab_mastered: 6,
      total_study_time_seconds: 600,
    };

    const cards = createDashboardStats(stats);

    expect(cards).toHaveLength(6);
    expect(cards.map((card) => card.label)).toContain("Saved Vocabulary");
    expect(cards.find((card) => card.label === "Study Time")?.value).toBe(
      "10m",
    );
  });
});
