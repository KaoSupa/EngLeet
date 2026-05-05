"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileSummary = {
  display_name: string | null;
  username: string | null;
  role: "user" | "admin";
  preferred_cefr_level: string | null;
};

type StatsSummary = {
  total_xp: number;
  level: number;
  current_streak: number;
  lessons_completed: number;
  quizzes_completed: number;
  vocab_mastered: number;
};

type DashboardSummaryResponse = {
  profile: ProfileSummary | null;
  stats: StatsSummary | null;
};

type SummaryState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardSummaryResponse }
  | { status: "error"; message: string };

export default function DashboardSummary({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<SummaryState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const response = await fetch("/api/dashboard/summary", {
          credentials: "same-origin",
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Unable to load dashboard summary");
        }

        const data = (await response.json()) as DashboardSummaryResponse;

        if (active) {
          setState({ status: "ready", data });
        }
      } catch {
        if (active) {
          setState({
            status: "error",
            message: "โหลดข้อมูล Dashboard ไม่สำเร็จ โปรดลองใหม่อีกครั้ง",
          });
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.status === "ready" && state.data.profile?.role === "admin") {
      router.replace("/admin");
    }
  }, [router, state]);

  const profile = state.status === "ready" ? state.data.profile : null;
  const stats = state.status === "ready" ? state.data.stats : null;
  const displayName =
    profile?.display_name ?? profile?.username ?? initialEmail ?? "Learner";

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">สวัสดี {displayName}</h1>
            <p className="text-muted-foreground">
              ติดตามความคืบหน้า XP และ streak ของคุณได้จากหน้านี้
            </p>
            {state.status === "error" && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            )}
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
          loading={state.status === "loading"}
        />
        <StatCard
          label="XP"
          value={stats?.total_xp ?? 0}
          loading={state.status === "loading"}
        />
        <StatCard
          label="Streak"
          value={`${stats?.current_streak ?? 0} วัน`}
          loading={state.status === "loading"}
        />
        <StatCard
          label="Vocab"
          value={stats?.vocab_mastered ?? 0}
          loading={state.status === "loading"}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Lessons completed"
          value={stats?.lessons_completed ?? 0}
          loading={state.status === "loading"}
        />
        <StatCard
          label="Quizzes completed"
          value={stats?.quizzes_completed ?? 0}
          loading={state.status === "loading"}
        />
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="min-h-28 rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      )}
    </div>
  );
}
