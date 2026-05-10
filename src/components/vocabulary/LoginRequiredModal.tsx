"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

import { VocabularyModalShell } from "./VocabularyModalShell";

type LoginRequiredModalProps = {
  onClose: () => void;
};

export function LoginRequiredModal({ onClose }: LoginRequiredModalProps) {
  const next = useMemo(() => {
    if (typeof window === "undefined") {
      return "/learn/vocabulary";
    }

    return `${window.location.pathname}${window.location.search}`;
  }, []);

  return (
    <VocabularyModalShell
      onClose={onClose}
      labelledBy="login-required-title"
      compact
    >
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 id="login-required-title" className="text-lg font-semibold">
              ต้องเข้าสู่ระบบก่อน
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              เข้าสู่ระบบเพื่อบันทึกคำศัพท์ไว้ทบทวนและติดตามความคืบหน้าของคุณ
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            ปิด
          </Button>
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>
              ไปหน้า Login
            </Link>
          </Button>
        </div>
      </div>
    </VocabularyModalShell>
  );
}
