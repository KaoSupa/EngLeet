import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone =
  | "neutral"
  | "a1"
  | "a2"
  | "b1"
  | "b2"
  | "c1"
  | "c2"
  | "toeic"
  | "oxford"
  | "category"
  | "part"
  | "difficulty"
  | "source";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  a1: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200",
  a2: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
  b1: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  b2: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200",
  c1: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200",
  c2: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-200",
  toeic:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-200",
  oxford:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200",
  category:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200",
  part: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-200",
  difficulty:
    "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-400/20 dark:bg-lime-400/10 dark:text-lime-200",
  source:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200",
};

export function getLearningBadgeTone(value: string | null | undefined) {
  const normalized = value?.toLowerCase();

  if (normalized === "a1") return "a1";
  if (normalized === "a2") return "a2";
  if (normalized === "b1") return "b1";
  if (normalized === "b2") return "b2";
  if (normalized === "c1") return "c1";
  if (normalized === "c2") return "c2";
  if (normalized === "toeic") return "toeic";
  if (normalized === "oxford") return "oxford";

  return "neutral";
}

export function LearningBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
