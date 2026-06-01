"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  Flame,
  Languages,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardStatIconName } from "@/lib/dashboard/dashboard-summary.utils";

const iconMap: Record<DashboardStatIconName, LucideIcon> = {
  star: Star,
  "book-open": BookOpen,
  trophy: Trophy,
  flame: Flame,
  languages: Languages,
  target: Target,
  clock: Clock3,
};

type DashboardStatCardProps = {
  label: string;
  value: string | number;
  iconName: DashboardStatIconName;
  iconClassName: string;
  index?: number;
};

export function DashboardStatCard({
  label,
  value,
  iconName,
  iconClassName,
  index = 0,
}: DashboardStatCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = iconMap[iconName];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm",
        "transition-shadow duration-300 hover:shadow-xl",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-cyan-100/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-cyan-500/5" />

      <div className="relative flex items-start gap-5">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
            iconClassName,
          )}
        >
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{label}</p>

          <motion.p
            key={String(value)}
            initial={reduceMotion ? false : { scale: 0.96 }}
            animate={reduceMotion ? undefined : { scale: 1 }}
            className="mt-2 text-4xl font-bold"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.article>
  );
}
