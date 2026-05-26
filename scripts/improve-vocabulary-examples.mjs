import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { x as extractTar } from "tar";

import {
  exampleSentenceForVocabularyEntry,
  isVerbTemplateExample,
} from "./vocabulary-example-sentences.mjs";

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "vocabulary",
  "wordnet-bulk-001.json",
);
const WORDNET_CACHE_DIR = path.join(process.cwd(), ".cache", "wordnet-3.0");
const DB_CONCURRENCY = 8;
const require = createRequire(import.meta.url);

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['â€™]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

async function ensureWordNet30Dict() {
  const dictPath = path.join(WORDNET_CACHE_DIR, "dict");
  if (existsSync(path.join(dictPath, "index.verb"))) {
    return dictPath;
  }

  const packageRoot = path.dirname(
    require.resolve("wndb-with-exceptions/package.json"),
  );
  const tarballPath = path.join(packageRoot, "WNdb-3.0.tar.gz");
  if (!existsSync(tarballPath)) {
    throw new Error(
      "Missing WordNet 3.0 tarball. Run `pnpm install` before improving examples.",
    );
  }

  mkdirSync(WORDNET_CACHE_DIR, { recursive: true });
  await extractTar({
    file: tarballPath,
    cwd: WORDNET_CACHE_DIR,
  });

  return dictPath;
}

function loadDataGlosses(dictPath, dataFileName) {
  const filePath = path.join(dictPath, dataFileName);
  const glosses = new Map();

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!/^\d{8}\s/.test(line)) {
      continue;
    }

    const separator = line.indexOf("|");
    if (separator === -1) {
      continue;
    }

    glosses.set(line.slice(0, 8), line.slice(separator + 1).trim());
  }

  return glosses;
}

function loadWordNetVerbExamples(dictPath) {
  const glosses = loadDataGlosses(dictPath, "data.verb");
  const examplesByLemma = new Map();
  const indexPath = path.join(dictPath, "index.verb");

  for (const line of readFileSync(indexPath, "utf8").split(/\r?\n/)) {
    if (!/^[a-z]/.test(line)) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    const lemma = parts[0]?.toLowerCase();
    const pos = parts[1];

    if (!lemma || pos !== "v") {
      continue;
    }

    const pointerCount = Number.parseInt(parts[3] ?? "0", 10);
    const firstOffset = parts[6 + pointerCount];
    const gloss = firstOffset ? glosses.get(firstOffset) : null;
    const example = gloss?.match(/"([^"]+)"/)?.[1]?.trim();

    if (example && !examplesByLemma.has(lemma)) {
      examplesByLemma.set(lemma, example);
    }
  }

  return examplesByLemma;
}

function improvePayload(payload, wordNetExamples, { refreshVerbs = false } = {}) {
  const updates = [];

  for (const entry of payload.entries ?? []) {
    if (
      entry.part_of_speech !== "verb" ||
      (!refreshVerbs && !isVerbTemplateExample(entry.example_sentence))
    ) {
      continue;
    }

    const nextExample = exampleSentenceForVocabularyEntry({
      ...entry,
      wordnetExample: wordNetExamples.get(entry.word.toLowerCase()) ?? null,
    });

    if (!nextExample || nextExample === entry.example_sentence) {
      continue;
    }

    updates.push({
      slug: entry.slug ? slugify(entry.slug) : slugify(entry.word),
      word: entry.word,
      before: entry.example_sentence,
      after: nextExample,
    });
    entry.example_sentence = nextExample;
  }

  payload.metadata = {
    ...payload.metadata,
    note:
      "Generated from WordNet 3.0 lemmas and glosses. Thai definitions are matched by Open Multilingual WordNet synset IDs when available. Examples use WordNet examples when suitable, with Engleet contextual fallbacks. Oxford-style and TOEIC-focused flags are Engleet curation labels, not official Oxford or ETS material.",
  };

  return updates;
}

function buildDatabaseUpdates(payload) {
  return (payload.entries ?? [])
    .filter(
      (entry) =>
        entry.part_of_speech === "verb" &&
        entry.example_sentence &&
        !isVerbTemplateExample(entry.example_sentence),
    )
    .map((entry) => ({
      slug: entry.slug ? slugify(entry.slug) : slugify(entry.word),
      word: entry.word,
      before: null,
      after: entry.example_sentence,
    }));
}

async function runPool(items, worker) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(DB_CONCURRENCY, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    },
  );

  await Promise.all(workers);
}

async function applyDatabaseUpdates(updates) {
  loadEnvFile(".env.local");

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

  let attempted = 0;
  let changed = 0;
  await runPool(updates, async (update) => {
    const { data, error } = await supabase
      .from("vocabulary")
      .update({ example_sentence: update.after })
      .eq("slug", update.slug)
      .like(
        "example_sentence",
        'Learners often practice the verb "%" in short conversations.',
      )
      .select("id");

    if (error) {
      throw error;
    }

    attempted += 1;
    changed += data?.length ?? 0;
    if (attempted % 100 === 0 || attempted === updates.length) {
      console.log(
        `Checked database examples ${attempted}/${updates.length}; changed ${changed}`,
      );
    }
  });

  const remaining = await supabase
    .from("vocabulary")
    .select("id, word, normalized_word, part_of_speech, definition, example_sentence")
    .like(
      "example_sentence",
      'Learners often practice the verb "%" in short conversations.',
    );

  if (remaining.error) {
    throw remaining.error;
  }

  const remainingUpdates = (remaining.data ?? [])
    .map((entry) => ({
      id: entry.id,
      word: entry.word,
      after: exampleSentenceForVocabularyEntry(entry),
    }))
    .filter((entry) => entry.after && !isVerbTemplateExample(entry.after));

  await runPool(remainingUpdates, async (update) => {
    const { data, error } = await supabase
      .from("vocabulary")
      .update({ example_sentence: update.after })
      .eq("id", update.id)
      .like(
        "example_sentence",
        'Learners often practice the verb "%" in short conversations.',
      )
      .select("id");

    if (error) {
      throw error;
    }

    changed += data?.length ?? 0;
  });

  console.log(
    `Changed ${changed} database rows. Remaining direct fixes: ${remainingUpdates.length}.`,
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const applyDb = process.argv.includes("--apply-db");
  const refreshVerbs = process.argv.includes("--refresh-verbs");
  const dictPath = await ensureWordNet30Dict();
  const wordNetExamples = loadWordNetVerbExamples(dictPath);
  const payload = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  const updates = improvePayload(payload, wordNetExamples, { refreshVerbs });

  console.log(`Found ${updates.length} verb examples to improve.`);
  console.table(
    updates.slice(0, 10).map((update) => ({
      word: update.word,
      after: update.after,
    })),
  );

  if (!dryRun) {
    writeFileSync(DATA_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Updated ${DATA_FILE}`);
  }

  if (applyDb) {
    await applyDatabaseUpdates(buildDatabaseUpdates(payload));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
