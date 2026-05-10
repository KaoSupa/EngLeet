import type { DashboardSummaryData } from "@/lib/dashboard/summary";

import { DashboardAchievementsPanel } from "./DashboardAchievementsPanel";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardProfileCard } from "./DashboardProfileCard";
import { DashboardStatCard } from "./DashboardStatsCard";
import { createDashboardStats } from "@/lib/dashboard/dashboard-summary.utils";

export default function DashboardSummary({
  summary,
  summaryError,
}: {
  summary: DashboardSummaryData;
  summaryError: string | null;
}) {
  const profile = summary.profile;
  const stats = summary.stats;

  const displayName = profile?.display_name ?? profile?.username ?? "Learner";
  const username = profile?.username ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  const statCards = createDashboardStats(stats);

  return (
    <div className="space-y-8">
      <DashboardHeader
        displayName={displayName}
        username={username}
        summaryError={summaryError}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardProfileCard
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl}
          level={stats.level}
          totalXp={stats.total_xp}
        />

        <section
          aria-label="Learning statistics"
          className="grid gap-6 sm:grid-cols-2 lg:col-span-2"
        >
          {statCards.map((card, index) => (
            <DashboardStatCard
              key={card.label}
              index={index}
              label={card.label}
              value={card.value}
              iconName={card.iconName}
              iconClassName={card.iconClassName}
            />
          ))}
        </section>
      </div>

      <DashboardAchievementsPanel />
    </div>
  );
}