export type NewsArticle = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: string | null;
};

export type NewsFilters = {
  q: string;
  category: GNewsCategory;
};

export type NewsResult = {
  articles: NewsArticle[];
  error: string | null;
  isConfigured: boolean;
};

export const GNEWS_CATEGORIES = [
  "general",
  "world",
  "nation",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
] as const;

export type GNewsCategory = (typeof GNEWS_CATEGORIES)[number];

const NEWS_REVALIDATE_SECONDS = 60 * 15;
const DEFAULT_GNEWS_BASE_URL = "https://gnews.io/api/v4";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function trimFilter(value: string | undefined, maxLength = 80) {
  return value?.trim().slice(0, maxLength) ?? "";
}

function isGNewsCategory(value: string): value is GNewsCategory {
  return GNEWS_CATEGORIES.includes(value as GNewsCategory);
}

function getGNewsApiKey() {
  return process.env.GNEWS_API_KEY ?? process.env.NEWS_API_KEY ?? "";
}

function getGNewsBaseUrl() {
  const configured =
    process.env.GNEWS_API_BASE_URL ?? process.env.NEWS_API_URL ?? "";
  const base = configured.trim() || DEFAULT_GNEWS_BASE_URL;

  return base.replace(/\/(?:search|top-headlines)\/?$/, "").replace(/\/+$/, "");
}

function getMaxResults() {
  const value = Number.parseInt(process.env.GNEWS_MAX_RESULTS ?? "", 10);
  if (!Number.isInteger(value)) {
    return 12;
  }

  return Math.min(Math.max(value, 1), 100);
}

export function parseNewsFilters(
  searchParams: Record<string, string | string[] | undefined>,
): NewsFilters {
  const category = trimFilter(firstParam(searchParams.category), 32);

  return {
    q: trimFilter(firstParam(searchParams.q), 120),
    category: isGNewsCategory(category) ? category : "general",
  };
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSource(value: unknown) {
  if (typeof value === "string") {
    return getString(value);
  }

  if (typeof value === "object" && value !== null) {
    return getString((value as Record<string, unknown>).name);
  }

  return null;
}

function toNewsArticle(value: unknown, index: number): NewsArticle | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = getString(record.title);
  const url = getString(record.url);

  if (!title || !url) {
    return null;
  }

  return {
    id: `${url}-${index}`,
    title,
    description: getString(record.description),
    content: getString(record.content),
    url,
    imageUrl: getString(record.image),
    source: getSource(record.source),
    publishedAt: getString(record.publishedAt),
  };
}

function getGNewsArticles(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const articles = (payload as Record<string, unknown>).articles;
  return Array.isArray(articles) ? articles : [];
}

function buildGNewsUrl(filters: NewsFilters) {
  const hasSearch = Boolean(filters.q);
  const endpoint = hasSearch ? "search" : "top-headlines";
  const url = new URL(`${getGNewsBaseUrl()}/${endpoint}`);
  const apiKey = getGNewsApiKey();

  if (hasSearch) {
    url.searchParams.set("q", filters.q);
    url.searchParams.set("in", "title,description,content");
  } else {
    url.searchParams.set("category", filters.category);
  }

  url.searchParams.set("lang", process.env.GNEWS_LANG ?? "en");
  url.searchParams.set("country", process.env.GNEWS_COUNTRY ?? "us");
  url.searchParams.set("max", getMaxResults().toString());
  url.searchParams.set("nullable", "description,content,image");
  url.searchParams.set("apikey", apiKey);

  return url;
}

export async function getNewsArticles(
  filters: NewsFilters,
): Promise<NewsResult> {
  if (!getGNewsApiKey()) {
    return {
      articles: [],
      error: null,
      isConfigured: false,
    };
  }

  try {
    const response = await fetch(buildGNewsUrl(filters), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        errors?: string[];
      } | null;

      return {
        articles: [],
        error:
          body?.errors?.[0] ??
          `Unable to load GNews articles. Status ${response.status}.`,
        isConfigured: true,
      };
    }

    const payload = (await response.json()) as unknown;
    const articles = getGNewsArticles(payload)
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => article !== null);

    return {
      articles,
      error: null,
      isConfigured: true,
    };
  } catch {
    return {
      articles: [],
      error: "Unable to load GNews articles right now.",
      isConfigured: true,
    };
  }
}
