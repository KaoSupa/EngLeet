"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleX, Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VocabularyFilters } from "@/lib/learning/vocabulary";

import { VocabularyFilterSelect } from "./VocabularyFilterSelect";
import { formatPartOfSpeech } from "./vocabulary-format";

type VocabularyToolbarProps = {
  filters: VocabularyFilters;
  availableTags: string[];
  isAuthenticated: boolean;
  total: number;
};

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const PART_OPTIONS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "interjection",
  "determiner",
] as const;

export function VocabularyToolbar({
  filters,
  availableTags,
  isAuthenticated,
  total,
}: VocabularyToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

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
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ q: query.trim() || null });
  }

  function clearFilters() {
    setQuery("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  const hasActiveFilters =
    filters.q ||
    filters.level !== "all" ||
    filters.part !== "all" ||
    filters.tag ||
    filters.list !== "all" ||
    filters.difficulty ||
    filters.savedOnly;

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Vocabulary tools
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPending
              ? "กำลังค้นหา..."
              : `${total} คำศัพท์ที่ตรงกับตัวกรอง`}
          </p>
        </div>

        {hasActiveFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <CircleX className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search vocabulary</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search word, definition, or Thai meaning"
            className="h-10 w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
        </label>
        <Button type="submit" className="h-10 px-4">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <VocabularyFilterSelect
          label="Level"
          value={filters.level}
          onChange={(value) => updateFilters({ level: value })}
        >
          <option value="all">All levels</option>
          {LEVEL_OPTIONS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </VocabularyFilterSelect>

        <VocabularyFilterSelect
          label="Part"
          value={filters.part}
          onChange={(value) => updateFilters({ part: value })}
        >
          <option value="all">All parts</option>
          {PART_OPTIONS.map((part) => (
            <option key={part} value={part}>
              {formatPartOfSpeech(part)}
            </option>
          ))}
        </VocabularyFilterSelect>

        <VocabularyFilterSelect
          label="Tag"
          value={filters.tag || "all"}
          onChange={(value) => updateFilters({ tag: value })}
        >
          <option value="all">All tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </VocabularyFilterSelect>

        <VocabularyFilterSelect
          label="List"
          value={filters.list}
          onChange={(value) => updateFilters({ list: value })}
        >
          <option value="all">All lists</option>
          <option value="toeic">TOEIC</option>
          <option value="oxford">Oxford</option>
        </VocabularyFilterSelect>

        <VocabularyFilterSelect
          label="Difficulty"
          value={filters.difficulty?.toString() ?? "all"}
          onChange={(value) => updateFilters({ difficulty: value })}
        >
          <option value="all">Any difficulty</option>
          {[1, 2, 3, 4, 5].map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}/5
            </option>
          ))}
        </VocabularyFilterSelect>

        <VocabularyFilterSelect
          label="Saved"
          value={filters.savedOnly ? "1" : "all"}
          onChange={(value) => updateFilters({ saved: value })}
          disabled={!isAuthenticated}
        >
          <option value="all">All words</option>
          <option value="1">Saved only</option>
        </VocabularyFilterSelect>
      </div>
    </section>
  );
}
