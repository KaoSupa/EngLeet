"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  DashboardProfileSummary,
  InitialUserProfile,
} from "@/lib/users/profile";

type StatsSummary = {
  total_xp: number;
  level: number;
  current_streak: number;
  lessons_completed: number;
  quizzes_completed: number;
  vocab_mastered: number;
};

type DashboardSummaryResponse = {
  profile: DashboardProfileSummary | null;
  stats: StatsSummary | null;
};

type SummaryState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardSummaryResponse }
  | { status: "error"; message: string };

export default function DashboardSummary({
  initialProfile,
}: {
  initialProfile: InitialUserProfile;
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
    profile?.display_name ??
    profile?.username ??
    initialProfile.displayName ??
    initialProfile.username ??
    "Learner";
  const username = profile?.username ?? initialProfile.username;
  const avatarUrl = profile?.avatar_url ?? initialProfile.avatarUrl;

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
              {state.status === "error" && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.message}
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
