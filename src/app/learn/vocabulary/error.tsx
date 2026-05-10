"use client";

import { Button } from "@/components/ui/button";

export default function VocabularyError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">โหลดคำศัพท์ไม่สำเร็จ</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          มีบางอย่างผิดพลาดระหว่างโหลดหน้า Vocabulary โปรดลองอีกครั้ง
        </p>
        <Button type="button" onClick={reset} className="mt-5">
          ลองใหม่
        </Button>
      </div>
    </main>
  );
}
