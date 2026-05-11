"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-background px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-destructive">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold">This page could not load</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The error has been logged with its digest. Try again, or come back to
          this page later.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
      </div>
    </main>
  );
}
