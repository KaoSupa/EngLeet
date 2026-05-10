"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { getLevelProgress } from "@/lib/dashboard/dashboard-summary.utils";

type DashboardProfileCardProps = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
};

export function DashboardProfileCard({
  displayName,
  username,
  avatarUrl,
  level,
  totalXp,
}: DashboardProfileCardProps) {
  const reduceMotion = useReducedMotion();
  const progress = getLevelProgress(totalXp);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, x: -10 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm"
    >
      <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          transition={{ type: "spring", stiffness: 250 }}
          className="relative"
        >
          <Avatar name={displayName} avatarUrl={avatarUrl} />

          {!reduceMotion && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full border border-cyan-300/40"
            />
          )}
        </motion.div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Sparkles className="h-4 w-4" />
          Level {level}
        </div>

        {username && (
          <p className="mt-2 text-sm text-muted-foreground">@{username}</p>
        )}

        <div className="mt-8 w-full space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress.currentXp}/{progress.requiredXp} XP
            </span>
          </div>

          <Progress value={progress.percent} className="h-3 rounded-full" />
        </div>
      </div>
    </motion.section>
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
      className={cn(
        "relative flex h-32 w-32 items-center justify-center overflow-hidden",
        "rounded-full border-4 border-background bg-muted",
        "text-5xl font-bold shadow-2xl"
      )}
      aria-label={name}
      role="img"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          sizes="128px"
          className="object-cover"
          priority={false}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}