import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, role, preferred_cefr_level")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_stats")
      .select(
        "total_xp, level, current_streak, lessons_completed, quizzes_completed, vocab_mastered",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-2">
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold">
            สวัสดี {profile?.display_name ?? profile?.username ?? user.email}
          </h1>
          <p className="text-muted-foreground">
            ติดตามความคืบหน้า XP และ streak ของคุณได้จากหน้านี้
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Level" value={stats?.level ?? 1} />
          <StatCard label="XP" value={stats?.total_xp ?? 0} />
          <StatCard label="Streak" value={`${stats?.current_streak ?? 0} วัน`} />
          <StatCard label="Vocab" value={stats?.vocab_mastered ?? 0} />
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
      </div>
    </main>
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
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
