"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CompleteLessonButton({
  lessonId,
  isAuthenticated,
}: {
  lessonId: string;
  isAuthenticated: boolean;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline">
        <Link href="/login?next=/learn/lessons">
          <Lock />
          Login to save progress
        </Link>
      </Button>
    );
  }

  function completeLesson() {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/learning/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyTimeSeconds: 0 }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "บันทึกบทเรียนไม่สำเร็จ");
        return;
      }

      setDone(true);
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={completeLesson} disabled={done || isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        {done ? "Completed" : "Complete lesson"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
