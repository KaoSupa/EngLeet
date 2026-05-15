import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];
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
  error: string | null;
};

export const VOCABULARY_PAGE_SIZE = 50;

const VOCABULARY_SELECT = `
  id,
  word,
  slug,
  normalized_word,
  definition,
  definition_th,
  example_sentence,
  example_sentence_th,
  part_of_speech,
  cefr_level,
  difficulty,
  frequency_rank,
  phonetic,
  tags,
  is_toeic,
  is_oxford,
  image_url,
  tts_audio_url,
  source,
  source_url,
  license,
  review_status
`;

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

function sanitizeIlikeValue(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export async function getVocabularyPageData({
  supabase,
  filters,
  userId,
  offset = 0,
  includeTags = true,
}: {
  supabase: SupabaseClient<Database>;
  filters: VocabularyFilters;
  userId: string | null;
  offset?: number;
  includeTags?: boolean;
}): Promise<VocabularyPageData> {
  const safeOffset = Math.max(0, offset);
  const [savedVocabularyIds, availableTags] = await Promise.all([
    getSavedVocabularyIds(supabase, userId),
    includeTags ? getAvailableVocabularyTags(supabase) : Promise.resolve([]),
  ]);
  const savedIdSet = new Set(savedVocabularyIds);

  if (filters.savedOnly && !userId) {
    return {
      items: [],
      savedVocabularyIds,
      availableTags,
      total: 0,
      error: null,
    };
  }

  const countStrategy = filters.savedOnly ? "exact" : "planned";
  let query = supabase
    .from("vocabulary")
    .select(VOCABULARY_SELECT, { count: countStrategy })
    .eq("status", "published")
    .eq("review_status", "approved")
    .order("frequency_rank", { ascending: true, nullsFirst: false })
    .order("word", { ascending: true })
    .range(safeOffset, safeOffset + VOCABULARY_PAGE_SIZE - 1);

  if (filters.q) {
    const search = sanitizeIlikeValue(filters.q);
    if (search) {
      query = query.or(
        `word.ilike.%${search}%,normalized_word.ilike.%${search}%,definition.ilike.%${search}%,definition_th.ilike.%${search}%`,
      );
    }
  }

  if (filters.level !== "all") {
    query = query.eq("cefr_level", filters.level);
  }

  if (filters.part !== "all") {
    query = query.eq("part_of_speech", filters.part);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters.list === "toeic") {
    query = query.eq("is_toeic", true);
  }

  if (filters.list === "oxford") {
    query = query.eq("is_oxford", true);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.savedOnly) {
    if (savedVocabularyIds.length === 0) {
      return {
        items: [],
        savedVocabularyIds,
        availableTags,
        total: 0,
        error: null,
      };
    }

    query = query.in("id", savedVocabularyIds);
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      items: [],
      savedVocabularyIds,
      availableTags,
      total: 0,
      error: "Unable to load vocabulary right now.",
    };
  }

  return {
    items: (data ?? []).filter((item) =>
      filters.savedOnly ? savedIdSet.has(item.id) : true,
    ) as VocabularyItem[],
    savedVocabularyIds,
    availableTags,
    total: count ?? data?.length ?? 0,
    error: null,
  };
}
