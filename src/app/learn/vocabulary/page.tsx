import type { Metadata } from "next";

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

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: VocabularyPageSearchParams;
}) {
  const params = await searchParams;
  const filters = parseVocabularyFilters(params);
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
          <p className="text-sm font-medium text-muted-foreground">
            Vocabulary
          </p>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Explore words for real English practice
            </h1>
            <p className="text-muted-foreground">
              ค้นหาคำศัพท์ กรองตามระดับ ประเภทคำศัพท์ แท็ก TOEIC/Oxford
              และบันทึกคำที่อยากทบทวนไว้ในคลังของคุณ
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
          initialNextCursor={data.nextCursor}
          error={data.error}
        />
      </div>
    </main>
  );
}
