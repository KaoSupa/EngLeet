import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { x as extractTar } from "tar";

const DATA_DIR = path.join(process.cwd(), "data", "vocabulary");
const OUTPUT_FILE = path.join(DATA_DIR, "wordnet-bulk-001.json");
const WORDNET_CACHE_DIR = path.join(process.cwd(), ".cache", "wordnet-3.0");
const GENERATED_COUNT_TARGET = 9000;
const CORE_STYLE_TARGET = 3000;
const TOEIC_FOCUSED_TARGET = 3000;
const DAILY_LIFE_TARGET = 3000;
const require = createRequire(import.meta.url);

const POS_FILES = {
  noun: { index: "index.noun", data: "data.noun", wordnetPos: "n" },
  verb: { index: "index.verb", data: "data.verb", wordnetPos: "v" },
  adjective: { index: "index.adj", data: "data.adj", wordnetPos: "a" },
  adverb: { index: "index.adv", data: "data.adv", wordnetPos: "r" },
};

const TOEIC_HINTS = [
  "account",
  "advertise",
  "agreement",
  "airport",
  "applicant",
  "appointment",
  "approve",
  "bank",
  "bill",
  "branch",
  "budget",
  "business",
  "career",
  "client",
  "company",
  "conference",
  "contract",
  "customer",
  "deadline",
  "deliver",
  "department",
  "document",
  "employee",
  "expense",
  "factory",
  "finance",
  "hotel",
  "insurance",
  "interview",
  "invoice",
  "manager",
  "market",
  "meeting",
  "office",
  "order",
  "payment",
  "policy",
  "presentation",
  "product",
  "profit",
  "project",
  "purchase",
  "receipt",
  "recruit",
  "refund",
  "report",
  "reservation",
  "resume",
  "salary",
  "schedule",
  "service",
  "shipment",
  "staff",
  "supplier",
  "tax",
  "ticket",
  "training",
  "travel",
  "warehouse",
];

const DAILY_HINTS = [
  "activity",
  "apartment",
  "bath",
  "body",
  "breakfast",
  "bus",
  "child",
  "class",
  "clothes",
  "coffee",
  "conversation",
  "cook",
  "day",
  "doctor",
  "drink",
  "family",
  "feel",
  "food",
  "friend",
  "game",
  "home",
  "house",
  "kitchen",
  "learn",
  "lesson",
  "meal",
  "morning",
  "movie",
  "music",
  "parent",
  "phone",
  "practice",
  "read",
  "room",
  "school",
  "shop",
  "sleep",
  "speak",
  "street",
  "student",
  "study",
  "teacher",
  "train",
  "walk",
  "water",
  "week",
  "work",
  "write",
];

const BLOCKED_WORDS = new Set([
  "god",
  "jesus",
  "sex",
  "sexy",
]);

const BLOCKED_GLOSS_PARTS = [
  "sexual",
  "genital",
  "copulation",
  "excrement",
  "racial slur",
  "offensive term",
];

const THAI_TRANSLATION_FILES = [
  "omw-thai-wordnet.tab",
  "omw-thai-wiktionary.tab",
  "omw-thai-cldr.tab",
];

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

function isCleanLemma(lemma) {
  return (
    /^[a-z]{3,16}$/.test(lemma) &&
    !BLOCKED_WORDS.has(lemma) &&
    !lemma.endsWith("nesses") &&
    !lemma.endsWith("ings") &&
    !lemma.endsWith("ers")
  );
}

function loadExistingKeys() {
  const slugs = new Set();
  const words = new Set();

  if (!existsSync(DATA_DIR)) {
    return { slugs, words };
  }

  for (const fileName of readdirSync(DATA_DIR)) {
    if (!fileName.endsWith(".json") || fileName === path.basename(OUTPUT_FILE)) {
      continue;
    }

    const filePath = path.join(DATA_DIR, fileName);
    const payload = JSON.parse(readFileSync(filePath, "utf8"));
    for (const entry of payload.entries ?? []) {
      const word = normalizeWord(entry.normalized_word ?? entry.word ?? "");
      if (!word) {
        continue;
      }

      words.add(word);
      slugs.add(entry.slug ? slugify(entry.slug) : slugify(word));
    }
  }

  return { slugs, words };
}

async function ensureWordNet30Dict() {
  const dictPath = path.join(WORDNET_CACHE_DIR, "dict");
  if (existsSync(path.join(dictPath, "index.noun"))) {
    return dictPath;
  }

  const packageRoot = path.dirname(
    require.resolve("wndb-with-exceptions/package.json"),
  );
  const tarballPath = path.join(packageRoot, "WNdb-3.0.tar.gz");
  if (!existsSync(tarballPath)) {
    throw new Error(
      "Missing WordNet 3.0 tarball. Run `pnpm install` before generating vocabulary.",
    );
  }

  mkdirSync(WORDNET_CACHE_DIR, { recursive: true });
  await extractTar({
    file: tarballPath,
    cwd: WORDNET_CACHE_DIR,
  });

  return dictPath;
}

function cleanThaiLemma(value) {
  const lemma = value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[;|]+/g, ",")
    .trim();

  if (!lemma || !/[\u0E00-\u0E7F]/.test(lemma)) {
    return null;
  }

  if (lemma.length > 48) {
    return null;
  }

  return lemma;
}

function loadThaiTranslations() {
  const bySynset = new Map();

  for (const fileName of THAI_TRANSLATION_FILES) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) {
        continue;
      }

      const [synsetId, relation, ...rawValueParts] = line.split("\t");
      if (!synsetId || !relation?.includes("lemma")) {
        continue;
      }

      const lemma = cleanThaiLemma(rawValueParts.join("\t"));
      if (!lemma) {
        continue;
      }

      if (!bySynset.has(synsetId)) {
        bySynset.set(synsetId, []);
      }

      const translations = bySynset.get(synsetId);
      if (!translations.includes(lemma)) {
        translations.push(lemma);
      }
    }
  }

  return bySynset;
}

function definitionThForSynset(thaiTranslations, synsetId) {
  const translations = thaiTranslations.get(synsetId) ?? [];
  return translations.slice(0, 4).join(", ") || null;
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

    const offset = line.slice(0, 8);
    const gloss = line.slice(separator + 1).trim();
    glosses.set(offset, gloss);
  }

  return glosses;
}

function parseGloss(gloss) {
  const examples = [...gloss.matchAll(/"([^"]+)"/g)].map((match) =>
    match[1].trim(),
  );
  const definition = gloss
    .replace(/"[^"]+"/g, "")
    .split(";")
    .map((part) => part.trim())
    .find(Boolean);

  return {
    definition: cleanDefinition(definition ?? gloss),
    wordnetExample: examples[0] ?? null,
  };
}

function cleanDefinition(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\(|\)$/g, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();
}

function loadCandidates(dictPath, thaiTranslations) {
  const candidates = [];
  const bestByWord = new Map();

  for (const [partOfSpeech, files] of Object.entries(POS_FILES)) {
    const glosses = loadDataGlosses(dictPath, files.data);
    const indexPath = path.join(dictPath, files.index);

    for (const line of readFileSync(indexPath, "utf8").split(/\r?\n/)) {
      if (!/^[a-z]/.test(line)) {
        continue;
      }

      const parts = line.trim().split(/\s+/);
      const lemma = parts[0]?.toLowerCase();
      const pos = parts[1];

      if (!lemma || pos !== files.wordnetPos || !isCleanLemma(lemma)) {
        continue;
      }

      const synsetCount = Number.parseInt(parts[2] ?? "0", 10);
      const pointerCount = Number.parseInt(parts[3] ?? "0", 10);
      const tagSenseCountIndex = 5 + pointerCount;
      const firstOffsetIndex = 6 + pointerCount;
      const tagSenseCount = Number.parseInt(parts[tagSenseCountIndex] ?? "0", 10);
      const firstOffset = parts[firstOffsetIndex];
      const synsetId = `${firstOffset}-${files.wordnetPos}`;
      const gloss = firstOffset ? glosses.get(firstOffset) : null;

      if (!gloss || hasBlockedGloss(gloss)) {
        continue;
      }

      const { definition, wordnetExample } = parseGloss(gloss);
      if (!definition || definition.length < 12 || definition.length > 180) {
        continue;
      }

      const score =
        tagSenseCount * 1000 +
        synsetCount * 12 +
        Math.max(0, 18 - lemma.length);
      const candidate = {
        word: lemma,
        partOfSpeech,
        definition,
        definitionTh: definitionThForSynset(thaiTranslations, synsetId),
        wordnetExample,
        score,
        synsetId,
        synsetCount,
        tagSenseCount,
      };

      const current = bestByWord.get(lemma);
      if (!current || candidate.score > current.score) {
        bestByWord.set(lemma, candidate);
      }
    }
  }

  candidates.push(...bestByWord.values());
  candidates.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
  return candidates;
}

function hasBlockedGloss(gloss) {
  const normalized = gloss.toLowerCase();
  return BLOCKED_GLOSS_PARTS.some((part) => normalized.includes(part));
}

function hintScore(candidate, hints) {
  const haystack = `${candidate.word} ${candidate.definition}`.toLowerCase();
  return hints.reduce(
    (score, hint) => score + (haystack.includes(hint) ? 1 : 0),
    0,
  );
}

function selectSet(candidates, target, scorer) {
  return new Set(
    candidates
      .map((candidate, index) => ({
        word: candidate.word,
        score: scorer(candidate) * 100000 - index,
      }))
      .filter((item) => item.score > -99999)
      .sort((a, b) => b.score - a.score)
      .slice(0, target)
      .map((item) => item.word),
  );
}

function cefrForRank(rank) {
  if (rank <= 650) return "A1";
  if (rank <= 1700) return "A2";
  if (rank <= 3600) return "B1";
  if (rank <= 5400) return "B2";
  if (rank <= 6200) return "C1";
  return "C2";
}

function difficultyForCefr(cefr) {
  return { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 }[cefr] ?? 3;
}

function originalExample(word, partOfSpeech) {
  if (partOfSpeech === "verb") {
    return `Learners often practice the verb "${word}" in short conversations.`;
  }

  if (partOfSpeech === "adjective") {
    return `Learners can use "${word}" to describe people, places, or ideas.`;
  }

  if (partOfSpeech === "adverb") {
    return `Learners can use "${word}" to add detail to a sentence.`;
  }

  return `Learners often meet the word "${word}" in everyday English.`;
}

function buildRows(candidates, existingKeys, generatedAt) {
  const available = candidates.filter(
    (candidate) =>
      !existingKeys.words.has(candidate.word) &&
      !existingKeys.slugs.has(slugify(candidate.word)),
  );
  const coreStyleSet = new Set(
    available.slice(0, CORE_STYLE_TARGET).map((candidate) => candidate.word),
  );
  const toeicSet = selectSet(available, TOEIC_FOCUSED_TARGET, (candidate) => {
    const score = hintScore(candidate, TOEIC_HINTS);
    return score > 0 ? score + candidate.score / 100000 : 0;
  });
  const dailySet = selectSet(available, DAILY_LIFE_TARGET, (candidate) => {
    const score = hintScore(candidate, DAILY_HINTS);
    const shortWordBonus = candidate.word.length <= 8 ? 0.3 : 0;
    return score > 0 ? score + shortWordBonus + candidate.score / 100000 : 0;
  });
  const selectedWords = new Set([
    ...coreStyleSet,
    ...toeicSet,
    ...dailySet,
  ]);
  const selectedCandidates = [
    ...available.filter((candidate) => selectedWords.has(candidate.word)),
    ...available.filter((candidate) => !selectedWords.has(candidate.word)),
  ].slice(0, GENERATED_COUNT_TARGET);

  return selectedCandidates.map((candidate, index) => {
      const rank = 201 + index;
      const cefr = cefrForRank(rank);
      const tags = new Set([
        "wordnet",
        "engleet-bulk",
        candidate.partOfSpeech,
      ]);

      if (coreStyleSet.has(candidate.word)) {
        tags.add("core");
        tags.add("oxford-style");
      }

      if (toeicSet.has(candidate.word)) {
        tags.add("toeic-focused");
        tags.add("business");
      }

      if (dailySet.has(candidate.word)) {
        tags.add("daily-life");
      }

      return {
        word: candidate.word,
        part_of_speech: candidate.partOfSpeech,
        cefr_level: cefr,
        difficulty: difficultyForCefr(cefr),
        definition: candidate.definition,
        definition_th: candidate.definitionTh,
        example_sentence: originalExample(candidate.word, candidate.partOfSpeech),
        example_sentence_th: null,
        frequency_rank: rank,
        tags: Array.from(tags).sort(),
        status: candidate.definitionTh ? "published" : "draft",
        review_status: candidate.definitionTh ? "approved" : "ai_draft",
        reviewed_at: candidate.definitionTh ? generatedAt : null,
        is_toeic: toeicSet.has(candidate.word),
        is_oxford: coreStyleSet.has(candidate.word),
      };
    });
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const existingKeys = loadExistingKeys();
  const dictPath = await ensureWordNet30Dict();
  const thaiTranslations = loadThaiTranslations();
  const candidates = loadCandidates(dictPath, thaiTranslations);
  const entries = buildRows(candidates, existingKeys, generatedAt);

  const payload = {
    defaults: {
      status: "draft",
      review_status: "ai_draft",
      source: "imported",
      source_url: "https://wordnet.princeton.edu/",
      license:
        "WordNet 3.0 License; Open Multilingual WordNet / Thai WordNet translation data; Engleet original example sentences; learner list curated by Engleet",
      reviewed_at: null,
      is_toeic: false,
      is_oxford: false,
      tags: ["wordnet", "engleet-bulk"],
    },
    metadata: {
      generated_at: generatedAt,
      generator: "scripts/generate-wordnet-vocabulary-seed.mjs",
      note:
        "Generated from WordNet 3.0 lemmas and glosses. Thai definitions are matched by Open Multilingual WordNet synset IDs when available. Examples are original Engleet template sentences. Oxford-style and TOEIC-focused flags are Engleet curation labels, not official Oxford or ETS material.",
      counts: {
        total: entries.length,
        published_with_thai: entries.filter((entry) => entry.definition_th)
          .length,
        draft_without_thai: entries.filter((entry) => !entry.definition_th)
          .length,
        oxford_style: entries.filter((entry) => entry.is_oxford).length,
        toeic_focused: entries.filter((entry) => entry.is_toeic).length,
        daily_life: entries.filter((entry) => entry.tags.includes("daily-life"))
          .length,
      },
    },
    entries,
  };

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${entries.length} entries at ${OUTPUT_FILE}`);
  console.log(payload.metadata.counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
