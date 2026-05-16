import type { DashboardStatsSummary } from "@/lib/dashboard/summary";

export type DashboardStatIconName =
  | "star"
  | "book-open"
  | "trophy"
  | "flame"
  | "languages"
  | "target"
  | "clock";

export type DashboardStatItem = {
  label: string;
  value: string | number;
  iconName: DashboardStatIconName;
  iconClassName: string;
};

function getXpThresholdForLevel(level: number, xpPerStep: number) {
  const safeLevel = Math.max(1, Math.floor(level));

  return ((safeLevel - 1) * safeLevel * xpPerStep) / 2;
}

export function getLevelProgress(totalXp: number, xpPerStep = 100) {
  const safeTotalXp = Math.max(0, totalXp);
  const safeXpPerStep = Math.max(1, xpPerStep);
  const level =
    Math.floor((-1 + Math.sqrt(1 + (8 * safeTotalXp) / safeXpPerStep)) / 2) +
    1;
  const currentLevelStartXp = getXpThresholdForLevel(level, safeXpPerStep);
  const nextLevelStartXp = getXpThresholdForLevel(level + 1, safeXpPerStep);
  const requiredXp = Math.max(1, nextLevelStartXp - currentLevelStartXp);
  const currentXp = Math.max(0, safeTotalXp - currentLevelStartXp);

  return {
    currentXp,
    requiredXp,
    percent: Math.min(100, Math.round((currentXp / requiredXp) * 100)),
  };
}

export function formatStudyTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return "0m";
}

export function createDashboardStats(
  stats: DashboardStatsSummary,
): DashboardStatItem[] {
  return [
    {
      label: "Total XP",
      value: stats.total_xp,
      iconName: "star",
      iconClassName:
        "bg-amber-100 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      label: "Lessons Completed",
      value: stats.lessons_completed,
      iconName: "book-open",
      iconClassName:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Quizzes Completed",
      value: stats.quizzes_completed,
      iconName: "trophy",
      iconClassName:
        "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      label: "Current Streak",
      value: `${stats.current_streak} Days`,
      iconName: "flame",
      iconClassName:
        "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    },
    {
      label: "Saved Vocabulary",
      value: stats.vocab_mastered,
      iconName: "languages",
      iconClassName:
        "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    },
    {
      label: "Study Time",
      value: formatStudyTime(stats.total_study_time_seconds),
      iconName: "clock",
      iconClassName:
        "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
    },
  ];
}
