import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];
type VocabularySearchRow =
  Database["public"]["Functions"]["search_published_vocabulary"]["Returns"][number];
type VocabularyListRow =
  Database["public"]["Functions"]["list_published_vocabulary_page"]["Returns"][number];
type VocabularyResultRow = VocabularySearchRow | VocabularyListRow;
type PartOfSpeech = Database["public"]["Enums"]["part_of_speech"];
type CefrLevel = Database["public"]["Enums"]["cefr_level"];

export type VocabularyItem = Pick<
  VocabularyRow,
  | "id"
  | "word"
  | "slug"
  | "normalized_word"
  | "definition"
  | "definition_th"
  | "example_sentence"
  | "example_sentence_th"
  | "part_of_speech"
  | "cefr_level"
  | "difficulty"
  | "frequency_rank"
  | "phonetic"
  | "tags"
  | "is_toeic"
  | "is_oxford"
  | "image_url"
  | "tts_audio_url"
  | "source"
  | "source_url"
  | "license"
  | "review_status"
>;

export type VocabularySearchParams = {
  q?: string;
  level?: string;
  part?: string;
  tag?: string;
  list?: string;
  difficulty?: string;
  saved?: string;
};

export type VocabularyFilters = {
  q: string;
  level: CefrLevel | "all";
  part: PartOfSpeech | "all";
  tag: string;
  list: "all" | "toeic" | "oxford";
  difficulty: number | null;
  savedOnly: boolean;
};

export type VocabularyPageData = {
  items: VocabularyItem[];
  savedVocabularyIds: string[];
  availableTags: string[];
  total: number;
  nextCursor: string | null;
  error: string | null;
};

type VocabularyCursor = {
  frequencyRank: number | null;
  word: string;
  id: string;
};

export const VOCABULARY_PAGE_SIZE = 50;

const CEFR_LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PARTS_OF_SPEECH: readonly PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "interjection",
  "determiner",
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function trimFilter(value: string | undefined, maxLength = 80) {
  return value?.trim().slice(0, maxLength) ?? "";
}

function isCefrLevel(value: string): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel);
}

function isPartOfSpeech(value: string): value is PartOfSpeech {
  return PARTS_OF_SPEECH.includes(value as PartOfSpeech);
}

export function decodeVocabularyCursor(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<VocabularyCursor>;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.word !== "string" ||
      !(
        parsed.frequencyRank === null ||
        typeof parsed.frequencyRank === "number"
      )
    ) {
      return null;
    }

    return {
      id: parsed.id,
      word: parsed.word,
      frequencyRank: parsed.frequencyRank,
    };
  } catch {
    return null;
  }
}

function encodeVocabularyCursor(item: VocabularyItem) {
  const cursor: VocabularyCursor = {
    frequencyRank: item.frequency_rank,
    word: item.word,
    id: item.id,
  };

  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function getNextVocabularyCursor(items: VocabularyItem[], hasMore: boolean) {
  if (!hasMore) {
    return null;
  }

  const lastItem = items.at(-1);
  return lastItem ? encodeVocabularyCursor(lastItem) : null;
}

export function parseVocabularyFilters(
  searchParams: Record<string, string | string[] | undefined>,
): VocabularyFilters {
  const level = trimFilter(firstParam(searchParams.level));
  const part = trimFilter(firstParam(searchParams.part));
  const list = trimFilter(firstParam(searchParams.list));
  const difficulty = Number.parseInt(
    trimFilter(firstParam(searchParams.difficulty)),
    10,
  );

  return {
    q: trimFilter(firstParam(searchParams.q)),
    level: isCefrLevel(level) ? level : "all",
    part: isPartOfSpeech(part) ? part : "all",
    tag: trimFilter(firstParam(searchParams.tag), 32),
    list: list === "toeic" || list === "oxford" ? list : "all",
    difficulty:
      Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 5
        ? difficulty
        : null,
    savedOnly: firstParam(searchParams.saved) === "1",
  };
}

export async function getOptionalApiUser(
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const email = typeof claims?.email === "string" ? claims.email : null;

  if (error || !userId) {
    return null;
  }

  return { id: userId, email };
}

async function getSavedVocabularyIds(
  supabase: SupabaseClient<Database>,
  userId: string | null,
) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_vocabulary")
    .select("vocabulary_id")
    .eq("user_id", userId);

  if (error) {
    return [];
  }

  return data.map((item) => item.vocabulary_id);
}

async function getAvailableVocabularyTags(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("vocabulary")
    .select("tags")
    .eq("status", "published")
    .eq("review_status", "approved")
    .limit(500);

  if (error) {
    return [];
  }

  const tags = new Set<string>();
  data.forEach((item) => {
    item.tags?.forEach((tag) => {
      const normalized = tag.trim();
      if (normalized) {
        tags.add(normalized);
      }
    });
  });

  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function toVocabularyItem(row: VocabularyResultRow): VocabularyItem {
  return {
    id: row.id,
    word: row.word,
    slug: row.slug,
    normalized_word: row.normalized_word,
    definition: row.definition,
    definition_th: row.definition_th,
    example_sentence: row.example_sentence,
    example_sentence_th: row.example_sentence_th,
    part_of_speech: row.part_of_speech,
    cefr_level: row.cefr_level,
    difficulty: row.difficulty,
    frequency_rank: row.frequency_rank,
    phonetic: row.phonetic,
    tags: row.tags,
    is_toeic: row.is_toeic,
    is_oxford: row.is_oxford,
    image_url: row.image_url,
    tts_audio_url: row.tts_audio_url,
    source: row.source,
    source_url: row.source_url,
    license: row.license,
    review_status: row.review_status,
  };
}

async function searchVocabularyPageData({
  supabase,
  filters,
  userId,
  offset,
  savedVocabularyIds,
  availableTags,
}: {
  supabase: SupabaseClient<Database>;
  filters: VocabularyFilters;
  userId: string | null;
  offset: number;
  savedVocabularyIds: string[];
  availableTags: string[];
}): Promise<VocabularyPageData> {
  const { data, error } = await supabase.rpc("search_published_vocabulary", {
    p_query: filters.q,
    p_level: filters.level === "all" ? null : filters.level,
    p_part: filters.part === "all" ? null : filters.part,
    p_tag: filters.tag || null,
    p_list: filters.list,
    p_difficulty: filters.difficulty,
    p_saved_user_id: userId,
    p_saved_only: filters.savedOnly,
    p_limit: VOCABULARY_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    return {
      items: [],
      savedVocabularyIds,
      availableTags,
      total: 0,
      nextCursor: null,
      error: "Unable to load vocabulary right now.",
    };
  }

  const items = (data ?? []).map(toVocabularyItem);

  return {
    items,
    savedVocabularyIds,
    availableTags,
    total: data?.[0]?.total_count ?? data?.length ?? 0,
    nextCursor: null,
    error: null,
  };
}

async function listVocabularyPageData({
  supabase,
  filters,
  userId,
  cursor,
  savedVocabularyIds,
  availableTags,
}: {
  supabase: SupabaseClient<Database>;
  filters: VocabularyFilters;
  userId: string | null;
  cursor: VocabularyCursor | null;
  savedVocabularyIds: string[];
  availableTags: string[];
}): Promise<VocabularyPageData> {
  const { data, error } = await supabase.rpc("list_published_vocabulary_page", {
    p_level: filters.level === "all" ? null : filters.level,
    p_part: filters.part === "all" ? null : filters.part,
    p_tag: filters.tag || null,
    p_list: filters.list,
    p_difficulty: filters.difficulty,
    p_saved_user_id: userId,
    p_saved_only: filters.savedOnly,
    p_after_frequency_rank: cursor?.frequencyRank ?? null,
    p_after_word: cursor?.word ?? null,
    p_after_id: cursor?.id ?? null,
    p_limit: VOCABULARY_PAGE_SIZE + 1,
  });

  if (error) {
    return {
      items: [],
      savedVocabularyIds,
      availableTags,
      total: 0,
      nextCursor: null,
      error: "Unable to load vocabulary right now.",
    };
  }

  const rows = data ?? [];
  const items = rows.slice(0, VOCABULARY_PAGE_SIZE).map(toVocabularyItem);
  const total = rows[0]?.total_count ?? items.length;
  const hasMore = rows.length > VOCABULARY_PAGE_SIZE;

  return {
    items,
    savedVocabularyIds,
    availableTags,
    total,
    nextCursor: getNextVocabularyCursor(items, hasMore),
    error: null,
  };
}

export async function getVocabularyPageData({
  supabase,
  filters,
  userId,
  offset = 0,
  cursor = null,
  includeTags = true,
}: {
  supabase: SupabaseClient<Database>;
  filters: VocabularyFilters;
  userId: string | null;
  offset?: number;
  cursor?: VocabularyCursor | null;
  includeTags?: boolean;
}): Promise<VocabularyPageData> {
  const safeOffset = Math.max(0, offset);
  const [savedVocabularyIds, availableTags] = await Promise.all([
    getSavedVocabularyIds(supabase, userId),
    includeTags ? getAvailableVocabularyTags(supabase) : Promise.resolve([]),
  ]);

  if (filters.savedOnly && !userId) {
    return {
      items: [],
      savedVocabularyIds,
      availableTags,
      total: 0,
      nextCursor: null,
      error: null,
    };
  }

  if (filters.q) {
    return searchVocabularyPageData({
      supabase,
      filters,
      userId,
      offset: safeOffset,
      savedVocabularyIds,
      availableTags,
    });
  }

  return listVocabularyPageData({
    supabase,
    filters,
    userId,
    cursor,
    savedVocabularyIds,
    availableTags,
  });
}
