"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import {
  GNEWS_CATEGORIES,
  type NewsFilters as NewsFilterValues,
} from "@/lib/news/news";

export default function NewsFilters({
  filters,
}: {
  filters: NewsFilterValues;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "general") {
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
    <section className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <span className="sr-only">Search news</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search news"
            className="h-10 w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
        </label>
        <select
          value={filters.category}
          onChange={(event) => updateFilters({ category: event.target.value })}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm capitalize outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
        >
          {GNEWS_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        {isPending ? "Updating news..." : "Filters update automatically."}
      </p>
    </section>
  );
}
