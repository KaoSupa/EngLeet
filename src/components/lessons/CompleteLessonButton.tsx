"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Lock, Timer } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const MAX_IDLE_MS = 60_000;
const TICK_MS = 1_000;

type CompleteLessonResponse = {
  data?: {
    status?: string;
    xp_earned?: number;
  } | null;
  error?: string;
};

function getCompletionTargetSeconds(estimatedMinutes: number) {
  const estimatedSeconds = Math.max(1, estimatedMinutes) * 60;

  return Math.min(600, Math.max(45, Math.round(estimatedSeconds * 0.8)));
}

function formatRemainingTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function isPageActive(lastInteractionAt: number) {
  return (
    document.visibilityState === "visible" &&
    Date.now() - lastInteractionAt <= MAX_IDLE_MS
  );
}

export default function CompleteLessonButton({
  lessonId,
  isAuthenticated,
  initialCompleted = false,
  xpReward = 0,
  estimatedMinutes = 1,
}: {
  lessonId: string;
  isAuthenticated: boolean;
  initialCompleted?: boolean;
  xpReward?: number;
  estimatedMinutes?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const targetSeconds = useMemo(
    () => getCompletionTargetSeconds(estimatedMinutes),
    [estimatedMinutes],
  );
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [done, setDone] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialCompleted ? "Progress saved" : null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const lastInteractionAtRef = useRef(Date.now());
  const lastTickAtRef = useRef<number | null>(null);
  const completedRequestRef = useRef(false);
  const activeSecondsRef = useRef(0);

  const progressPercent = done
    ? 100
    : Math.min(100, Math.round((activeSeconds / targetSeconds) * 100));
  const remainingSeconds = Math.max(0, targetSeconds - activeSeconds);

  const completeLesson = useCallback(async () => {
    if (completedRequestRef.current || done || !isAuthenticated) {
      return;
    }

    completedRequestRef.current = true;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/learning/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyTimeSeconds: 0 }),
      });
      const payload = (await response.json()) as CompleteLessonResponse;

      if (!response.ok) {
        completedRequestRef.current = false;
        setError(payload.error ?? "Unable to save lesson progress");
        return;
      }

      setDone(true);
      setSuccessMessage(
        payload.data?.xp_earned
          ? `Completed! +${payload.data.xp_earned} XP`
          : `Completed! ${xpReward > 0 ? "XP was already claimed." : "Progress saved."}`,
      );
      router.refresh();
    } catch {
      completedRequestRef.current = false;
      setError("Unable to save lesson progress. We will try again while you stay on this page.");
    } finally {
      setIsSaving(false);
    }
  }, [done, isAuthenticated, lessonId, router, xpReward]);

  useEffect(() => {
    activeSecondsRef.current = activeSeconds;
  }, [activeSeconds]);

  useEffect(() => {
    if (!isAuthenticated || done) {
      return;
    }

    function markInteraction() {
      lastInteractionAtRef.current = Date.now();
    }

    const activityEvents = [
      "keydown",
      "pointerdown",
      "pointermove",
      "scroll",
      "touchstart",
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { passive: true });
    });
    window.addEventListener("focus", markInteraction);

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const lastTickAt = lastTickAtRef.current ?? now;
      lastTickAtRef.current = now;

      if (!isPageActive(lastInteractionAtRef.current)) {
        return;
      }

      const deltaSeconds = Math.min(5, Math.max(0, (now - lastTickAt) / 1000));
      const nextSeconds = Math.min(
        targetSeconds,
        activeSecondsRef.current + deltaSeconds,
      );
      activeSecondsRef.current = nextSeconds;
      setActiveSeconds(nextSeconds);

      if (nextSeconds >= targetSeconds) {
        void completeLesson();
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });
      window.removeEventListener("focus", markInteraction);
    };
  }, [completeLesson, done, isAuthenticated, targetSeconds]);

  if (!isAuthenticated) {
    const next = encodeURIComponent(pathname || "/learn/lessons");

    return (
      <Button asChild variant="outline">
        <Link href={`/login?next=${next}`}>
          <Lock />
          Login to save progress
        </Link>
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {done ? (
            <Check className="size-4 text-emerald-600" />
          ) : isSaving ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Timer className="size-4 text-muted-foreground" />
          )}
          <span>{done ? "Lesson completed" : "Auto-completing lesson"}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {done ? "100%" : formatRemainingTime(remainingSeconds)}
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {!done && (
        <p className="text-xs leading-5 text-muted-foreground">
          Keep this lesson open and active. Progress pauses when the tab is idle.
        </p>
      )}

      {successMessage && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </p>
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={() => void completeLesson()}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
            Retry saving
          </Button>
        </div>
      )}
    </div>
  );
}
