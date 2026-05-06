import { createClient } from "@supabase/supabase-js";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const DATA_DIR = path.join(process.cwd(), "data", "vocabulary");
const BATCH_SIZE = 100;

const VALID_CEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const VALID_POS = new Set([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "interjection",
  "determiner",
]);
const VALID_STATUS = new Set(["draft", "published", "archived"]);
const VALID_REVIEW_STATUS = new Set(["ai_draft", "human_reviewed", "approved"]);
const VALID_SOURCE = new Set(["manual", "ai", "wiktionary", "imported"]);

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeWord(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function readVocabularyFiles() {
  if (!existsSync(DATA_DIR)) {
    throw new Error(`Vocabulary data directory not found: ${DATA_DIR}`);
  }

  return readdirSync(DATA_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(DATA_DIR, file));
}

function assertString(entry, key) {
  if (typeof entry[key] !== "string" || entry[key].trim() === "") {
    throw new Error(`Invalid vocabulary entry: "${key}" is required`);
  }

  return entry[key].trim();
}

function assertOptionalEnum(value, validValues, key, fallback) {
  const candidate = value ?? fallback;
  if (candidate === null || candidate === undefined) {
    return null;
  }

  if (!validValues.has(candidate)) {
    throw new Error(`Invalid "${key}" value: ${candidate}`);
  }

  return candidate;
}

function toVocabularyRow(entry, defaults) {
  const word = assertString(entry, "word");
  const partOfSpeech = assertOptionalEnum(
    entry.part_of_speech,
    VALID_POS,
    "part_of_speech",
    defaults.part_of_speech ?? null,
  );
  const cefrLevel = assertOptionalEnum(
    entry.cefr_level,
    VALID_CEFR,
    "cefr_level",
    defaults.cefr_level ?? null,
  );
  const status = assertOptionalEnum(
    entry.status,
    VALID_STATUS,
    "status",
    defaults.status ?? "draft",
  );
  const reviewStatus = assertOptionalEnum(
    entry.review_status,
    VALID_REVIEW_STATUS,
    "review_status",
    defaults.review_status ?? "ai_draft",
  );
  const source = assertOptionalEnum(
    entry.source,
    VALID_SOURCE,
    "source",
    defaults.source ?? "ai",
  );

  return {
    word,
    normalized_word: normalizeWord(entry.normalized_word ?? word),
    slug: entry.slug ? slugify(entry.slug) : slugify(word),
    part_of_speech: partOfSpeech,
    phonetic: entry.phonetic ?? null,
    cefr_level: cefrLevel,
    difficulty: entry.difficulty ?? null,
    definition: assertString(entry, "definition"),
    definition_th: entry.definition_th ?? null,
    example_sentence: entry.example_sentence ?? null,
    example_sentence_th: entry.example_sentence_th ?? null,
    frequency_rank: entry.frequency_rank ?? null,
    tags: Array.isArray(entry.tags) ? entry.tags : defaults.tags ?? [],
    image_url: entry.image_url ?? null,
    tts_audio_url: entry.tts_audio_url ?? null,
    status,
    review_status: reviewStatus,
    source,
    source_url: entry.source_url ?? defaults.source_url ?? null,
    license: entry.license ?? defaults.license ?? "Original Engleet content",
    reviewed_at: entry.reviewed_at ?? defaults.reviewed_at ?? null,
    is_toeic: entry.is_toeic ?? defaults.is_toeic ?? false,
    is_oxford: entry.is_oxford ?? defaults.is_oxford ?? false,
  };
}

function loadRows() {
  const rows = [];
  const seenSlugs = new Set();

  for (const file of readVocabularyFiles()) {
    const payload = JSON.parse(readFileSync(file, "utf8"));
    const defaults = payload.defaults ?? {};
    const entries = payload.entries;

    if (!Array.isArray(entries)) {
      throw new Error(`Expected "entries" array in ${file}`);
    }

    for (const entry of entries) {
      const row = toVocabularyRow(entry, defaults);

      if (seenSlugs.has(row.slug)) {
        throw new Error(`Duplicate vocabulary slug in seed files: ${row.slug}`);
      }

      seenSlugs.add(row.slug);
      rows.push(row);
    }
  }

  return rows;
}

function chunk(rows, size) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function main() {
  loadEnvFile(".env.local");

  const dryRun = process.argv.includes("--dry-run");
  const rows = loadRows();

  console.log(`Loaded ${rows.length} vocabulary entries.`);

  if (dryRun) {
    console.log("Dry run only. No rows were imported.");
    return;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let imported = 0;
  for (const batch of chunk(rows, BATCH_SIZE)) {
    const { error } = await supabase
      .from("vocabulary")
      .upsert(batch, { onConflict: "slug" });

    if (error) {
      throw error;
    }

    imported += batch.length;
    console.log(`Imported ${imported}/${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
