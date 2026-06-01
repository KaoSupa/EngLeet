import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Layers3, Search, Sparkles } from "lucide-react";

import VocabularyExplorer from "@/components/vocabulary/VocabularyExplorer";
import {
  getOptionalApiUser,
  getVocabularyPageData,
  parseVocabularyFilters,
} from "@/lib/learning/vocabulary";
import { createClient } from "@/lib/supabase/server";

type VocabularyPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const metadata: Metadata = {
  title: "Vocabulary | Engleet",
  description:
    "Search and filter English vocabulary by level, part of speech, tags, TOEIC, Oxford, and difficulty.",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: VocabularyPageSearchParams;
}) {
  const params = await searchParams;
  const filters = parseVocabularyFilters(params);
  const initialViewMode =
    firstParam(params.view) === "flashcards" ? "flashcards" : "browse";
  const supabase = await createClient();
  const user = await getOptionalApiUser(supabase);
  const data = await getVocabularyPageData({
    supabase,
    filters,
    userId: user?.id ?? null,
  });

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="surface-panel overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div className="max-w-3xl space-y-4">
              <p className="eyebrow">
                <BookOpenText className="size-4" />
                Vocabulary
              </p>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
                  Explore words for real English practice
                </h1>
                <p className="leading-7 text-muted-foreground">
                  ค้นหาคำศัพท์ กรองตามระดับ ประเภทคำ แท็ก TOEIC/Oxford
                  และบันทึกคำที่อยากทบทวนไว้ในคลังของคุณ
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary">
                  <Sparkles className="size-4" />
                  {data.total.toLocaleString("en-US")} words
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground">
                  <Search className="size-4" />
                  Selection lookup ready
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/learn/vocabulary?view=flashcards"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <Layers3 className="size-4" />
                Flashcards
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/35 hover:bg-muted"
              >
                Learning hub
              </Link>
            </div>
          </div>
        </section>

        <VocabularyExplorer
          key={JSON.stringify(filters)}
          items={data.items}
          filters={filters}
          availableTags={data.availableTags}
          savedVocabularyIds={data.savedVocabularyIds}
          isAuthenticated={Boolean(user)}
          total={data.total}
          initialNextCursor={data.nextCursor}
          initialViewMode={initialViewMode}
          enableFlashcards
          error={data.error}
        />
      </div>
    </main>
  );
}
