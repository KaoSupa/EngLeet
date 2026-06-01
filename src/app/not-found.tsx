import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Engleet",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-background px-4 py-16 sm:px-6">
      <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium text-primary">404</p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold sm:text-6xl">
              This page slipped out of the lesson plan.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              The page you opened does not exist, may have moved, or is not
              published yet. Start from learning content or search vocabulary
              instead.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">
                <Home />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/learn/lessons">
                <BookOpen />
                Lessons
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/learn/vocabulary">
                <Search />
                Vocabulary
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="grid aspect-square place-items-center rounded-lg bg-muted">
            <div className="space-y-2 text-center">
              <p className="text-8xl font-semibold">404</p>
              <p className="text-sm text-muted-foreground">Page not found</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
