"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_CATEGORIES,
  LESSON_LEVELS,
  type LessonFilters,
} from "@/lib/learning/lessons";

export default function LessonFilters({
  filters,
  total,
}: {
  filters: LessonFilters;
  total: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const hasFilters =
    filters.q || filters.level !== "all" || filters.category !== "all";

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  }

  function clearFilters() {
    setQuery("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  useEffect(() => {
    setQuery(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const nextQuery = query.trim();
    if (nextQuery === filters.q) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateFilters({ q: nextQuery || null });
    }, 450);

    return () => window.clearTimeout(timer);
    // searchParams is intentionally read inside updateFilters when the timer runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, query]);

  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4" />
            Lesson tools
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPending
              ? "Updating lessons..."
              : `${total} published lessons match your filters`}
          </p>
        </div>

        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X />
            Clear
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
        <label className="relative">
          <span className="sr-only">Search lessons</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons"
            className="focus-ring h-11 w-full rounded-lg border bg-background/80 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-ring"
          />
        </label>

        <label>
          <span className="sr-only">Level</span>
          <select
            value={filters.level}
            onChange={(event) => updateFilters({ level: event.target.value })}
            className="focus-ring h-11 w-full rounded-lg border bg-background/80 px-3 text-sm outline-none transition focus:border-ring"
          >
            <option value="all">All levels</option>
            {LESSON_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Category</span>
          <select
            value={filters.category}
            onChange={(event) =>
              updateFilters({ category: event.target.value })
            }
            className="focus-ring h-11 w-full rounded-lg border bg-background/80 px-3 text-sm capitalize outline-none transition focus:border-ring"
          >
            <option value="all">All categories</option>
            {LESSON_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
