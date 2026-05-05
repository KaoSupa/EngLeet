import type {
  DashboardSummaryData,
} from "@/lib/dashboard/summary";

export default function DashboardSummary({
  summary,
  summaryError,
}: {
  summary: DashboardSummaryData;
  summaryError: string | null;
}) {
  const profile = summary.profile;
  const stats = summary.stats;
  const displayName =
    profile?.display_name ??
    profile?.username ??
    "Learner";
  const username = profile?.username;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={displayName} avatarUrl={avatarUrl} />
            <div className="space-y-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold">สวัสดี {displayName}</h1>
                {username && (
                  <p className="text-sm text-muted-foreground">@{username}</p>
                )}
              </div>
              <p className="text-muted-foreground">
                ติดตามความคืบหน้า XP และ streak ของคุณได้จากหน้านี้
              </p>
              {summaryError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {summaryError}
                </p>
              )}
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Level"
          value={stats?.level ?? 1}
        />
        <StatCard
          label="XP"
          value={stats?.total_xp ?? 0}
        />
        <StatCard
          label="Streak"
          value={`${stats?.current_streak ?? 0} วัน`}
        />
        <StatCard
          label="Vocab"
          value={stats?.vocab_mastered ?? 0}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Lessons completed"
          value={stats?.lessons_completed ?? 0}
        />
        <StatCard
          label="Quizzes completed"
          value={stats?.quizzes_completed ?? 0}
        />
      </section>
    </>
  );
}

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "L";

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted bg-cover bg-center text-lg font-semibold text-muted-foreground shadow-sm"
      style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
      aria-label={name}
      role="img"
    >
      {!avatarUrl && initial}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-h-28 rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
