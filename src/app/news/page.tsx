import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Newspaper, Search, Volume2 } from "lucide-react";

import SafeImage from "@/components/media/SafeImage";
import NewsFilters from "@/components/news/NewsFilters";
import { Button } from "@/components/ui/button";
import { LearningBadge } from "@/components/ui/learning-badge";
import {
  getNewsArticles,
  parseNewsFilters,
} from "@/lib/news/news";

type NewsPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const metadata: Metadata = {
  title: "News | Engleet",
  description:
    "Read English news, discover vocabulary, and connect real-world articles with learning.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: NewsPageSearchParams;
}) {
  const filters = parseNewsFilters(await searchParams);
  const result = await getNewsArticles(filters);

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="surface-panel p-6 md:p-8">
          <div className="max-w-3xl space-y-4">
            <p className="eyebrow">
              <Newspaper className="size-4" />
              News
            </p>
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
                Learn English from real-world news
              </h1>
              <p className="leading-7 text-muted-foreground">
                News is loaded on the server, validated before rendering, and
                ready to connect with vocabulary extraction, quick lookup, and
                text-to-speech.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary">
                <Search className="size-4" />
                Select text to translate
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 font-medium text-secondary-foreground">
                <Volume2 className="size-4" />
                TTS ready
              </span>
            </div>
          </div>
        </section>

        <NewsFilters filters={filters} />

        {result.error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {result.error}
          </div>
        )}

        {!result.isConfigured ? (
          <NewsConfigEmptyState />
        ) : result.articles.length === 0 ? (
          <section className="surface-panel p-8">
            <h2 className="text-xl font-semibold">No news found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another keyword or category.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.articles.map((article) => (
              <article
                key={article.id}
                className="interactive-card group flex min-h-80 flex-col overflow-hidden"
              >
                {article.imageUrl ? (
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <SafeImage
                      src={article.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-primary/10">
                    <Newspaper className="size-8 text-primary" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {article.source && (
                      <LearningBadge tone="source">
                        {article.source}
                      </LearningBadge>
                    )}
                    {article.publishedAt && (
                      <LearningBadge>
                        {new Date(article.publishedAt).toLocaleDateString(
                          "en-US",
                        )}
                      </LearningBadge>
                    )}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-snug transition group-hover:text-primary">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                      {article.description}
                    </p>
                  )}
                  <Button asChild variant="outline" className="mt-auto w-fit">
                    <Link
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read source
                      <ExternalLink />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function NewsConfigEmptyState() {
  return (
    <section className="surface-panel p-8">
      <h2 className="text-xl font-semibold">GNews is not configured</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Add `GNEWS_API_KEY` or `NEWS_API_KEY` in Vercel environment variables.
        Keep the key server-only. `NEWS_API_URL` can be `https://gnews.io/api/v4`.
      </p>
    </section>
  );
}
