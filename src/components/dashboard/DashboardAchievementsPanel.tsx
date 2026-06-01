"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";

export function DashboardAchievementsPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="rounded-3xl border bg-card p-8 shadow-sm"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Achievements</h2>
        <p className="mt-1 text-muted-foreground">
          Unlock badges by completing lessons and quizzes.
        </p>
      </div>

      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>

          <p className="text-lg font-medium">No achievements yet</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Start learning to unlock your first badge.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
