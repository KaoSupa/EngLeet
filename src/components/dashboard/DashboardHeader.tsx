"use client";

import { motion, useReducedMotion } from "framer-motion";

type DashboardHeaderProps = {
  displayName: string;
  username: string | null;
  summaryError: string | null;
};

export function DashboardHeader({
  displayName,
  username,
  summaryError,
}: DashboardHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <p className="text-sm font-medium text-muted-foreground">Dashboard</p>

      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Welcome back, {displayName}
        </h1>

        {username && (
          <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
        )}
      </div>

      <p className="text-base text-muted-foreground sm:text-lg">
        Here an overview of your learning journey.
      </p>

      {summaryError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {summaryError}
        </div>
      )}
    </motion.section>
  );
}
