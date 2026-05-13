import type { Metadata } from "next";
import { Search } from "lucide-react";

import VocabularyExplorer from "@/components/vocabulary/VocabularyExplorer";
import {
  getOptionalApiUser,
  getVocabularyPageData,
  parseVocabularyFilters,
} from "@/lib/learning/vocabulary";
import { createClient } from "@/lib/supabase/server";

type DictionaryPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const metadata: Metadata = {
  title: "Dictionary | Engleet",
  description:
    "Look up English words with Thai meanings, examples, CEFR levels, and TOEIC/Oxford tags.",
};

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: DictionaryPageSearchParams;
}) {
  const filters = parseVocabularyFilters(await searchParams);
  const supabase = await createClient();
  const user = await getOptionalApiUser(supabase);
  const data = await getVocabularyPageData({
    supabase,
    filters,
    userId: user?.id ?? null,
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Search className="size-4" />
            Dictionary
          </p>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Search the shared Engleet dictionary
            </h1>
            <p className="text-muted-foreground">
              Dictionary uses the same global vocabulary resource as lessons,
              news, and future text-selection translation, so saved words and
              learning metadata stay connected.
            </p>
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
          error={data.error}
        />
      </div>
    </main>
  );
}
