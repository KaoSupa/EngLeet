import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];

export type TextLookupItem = Pick<
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
  | "phonetic"
  | "is_toeic"
  | "is_oxford"
  | "tts_audio_url"
>;

export type TextLookupResult = {
  query: string;
  normalizedQuery: string;
  mode: "word" | "phrase";
  translation: string | null;
  exactMatch: TextLookupItem | null;
  matches: TextLookupItem[];
};

export const MAX_TEXT_LOOKUP_LENGTH = 240;

const MAX_LOOKUP_CANDIDATES = 14;
const MAX_LOOKUP_MATCHES = 8;

const TEXT_LOOKUP_SELECT = `
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
  phonetic,
  is_toeic,
  is_oxford,
  tts_audio_url
`;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "she",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "with",
  "you",
  "your",
]);

export function normalizeLookupText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-zA-Z0-9'\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_TEXT_LOOKUP_LENGTH);
}

export function getTextLookupTokens(value: string) {
  return Array.from(normalizeLookupText(value).matchAll(/[a-z]+(?:'[a-z]+)?/g))
    .map((match) => match[0])
    .filter(Boolean);
}

export function getTextLookupCandidates(value: string) {
  const tokens = getTextLookupTokens(value);
  const isSingleToken = tokens.length === 1;
  const candidates: string[] = [];

  tokens.forEach((token) => {
    if (!isSingleToken && (STOP_WORDS.has(token) || token.length < 3)) {
      return;
    }

    addCandidate(candidates, token);
    getBaseForms(token).forEach((baseForm) => addCandidate(candidates, baseForm));
  });

  return candidates.slice(0, MAX_LOOKUP_CANDIDATES);
}

function addCandidate(candidates: string[], value: string) {
  if (value && !candidates.includes(value)) {
    candidates.push(value);
  }
}

function getBaseForms(token: string) {
  const forms = new Set<string>();

  if (token.endsWith("'s") && token.length > 3) {
    forms.add(token.slice(0, -2));
  }

  if (token.endsWith("ies") && token.length > 4) {
    forms.add(`${token.slice(0, -3)}y`);
  }

  if (token.endsWith("ing") && token.length > 5) {
    const stem = token.slice(0, -3);

    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) {
      forms.add(stem.slice(0, -1));
    } else {
      forms.add(stem);
    }
  }

  if (token.endsWith("ed") && token.length > 4) {
    const stem = token.slice(0, -2);

    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) {
      forms.add(stem.slice(0, -1));
    } else {
      forms.add(stem);
    }
  }

  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    forms.add(token.slice(0, -1));
  }

  return Array.from(forms);
}

export async function lookupSelectedText({
  supabase,
  text,
}: {
  supabase: SupabaseClient<Database>;
  text: string;
}): Promise<TextLookupResult> {
  const query = text.trim().slice(0, MAX_TEXT_LOOKUP_LENGTH);
  const normalizedQuery = normalizeLookupText(query);
  const tokens = getTextLookupTokens(normalizedQuery);
  const mode = tokens.length <= 1 ? "word" : "phrase";
  const candidates = getTextLookupCandidates(normalizedQuery);

  if (normalizedQuery.length < 2 || candidates.length === 0) {
    return {
      query,
      normalizedQuery,
      mode,
      translation: null,
      exactMatch: null,
      matches: [],
    };
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .select(TEXT_LOOKUP_SELECT)
    .eq("status", "published")
    .eq("review_status", "approved")
    .in("normalized_word", candidates)
    .limit(MAX_LOOKUP_MATCHES);

  if (error) {
    throw new Error("Unable to look up selected text");
  }

  const candidateRank = new Map(
    candidates.map((candidate, index) => [candidate, index]),
  );
  const matches = ((data ?? []) as TextLookupItem[]).sort((left, right) => {
    const leftRank = candidateRank.get(left.normalized_word) ?? 999;
    const rightRank = candidateRank.get(right.normalized_word) ?? 999;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.word.localeCompare(right.word);
  });
  const exactMatch =
    mode === "word"
      ? (matches.find((item) => candidates.includes(item.normalized_word)) ??
        null)
      : null;

  return {
    query,
    normalizedQuery,
    mode,
    translation: getLookupTranslation({ exactMatch, matches, mode }),
    exactMatch,
    matches,
  };
}

function getLookupTranslation({
  exactMatch,
  matches,
  mode,
}: {
  exactMatch: TextLookupItem | null;
  matches: TextLookupItem[];
  mode: TextLookupResult["mode"];
}) {
  if (exactMatch) {
    return exactMatch.definition_th ?? exactMatch.definition;
  }

  if (mode === "phrase" && matches.length > 0) {
    return matches
      .slice(0, 4)
      .map((item) => `${item.word}: ${item.definition_th ?? item.definition}`)
      .join("; ");
  }

  return null;
}
