import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parseLessonContentBlock,
  type LessonContentBlock,
} from "@/lib/learning/lesson-content";
import type { Database } from "@/types/supabase";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonContentRow = Database["public"]["Tables"]["lesson_contents"]["Row"];
type QuizQuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type CefrLevel = Database["public"]["Enums"]["cefr_level"];
type LessonCategory = Database["public"]["Enums"]["lesson_category"];
type PublicQuizOptionRow =
  Database["public"]["Views"]["public_quiz_options"]["Row"];

export const LESSON_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const LESSON_CATEGORIES = [
  "vocabulary",
  "grammar",
  "pronunciation",
  "listening",
  "reading",
  "writing",
  "speaking",
  "conversation",
] as const;

export type LessonFilters = {
  q: string;
  level: CefrLevel | "all";
  category: LessonCategory | "all";
};

type LessonQueryOptions = {
  limit?: number;
  offset?: number;
};

export type LessonListItem = Pick<
  LessonRow,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "thumbnail_url"
  | "cefr_level"
  | "category"
  | "estimated_minutes"
  | "xp_reward"
  | "published_at"
> & {
  unitTitle: string | null;
  courseTitle: string | null;
  questionCount: number;
};

export type LessonQuizQuestion = Pick<
  QuizQuestionRow,
  "id" | "question" | "type" | "points" | "order_index" | "explanation"
> & {
  options: Pick<PublicQuizOptionRow, "id" | "content" | "order_index">[];
};

export type LessonDetail = LessonListItem &
  Pick<LessonRow, "meta_title" | "meta_description" | "passing_score"> & {
    contents: LessonContentBlock[];
    quizQuestions: LessonQuizQuestion[];
  };

const LESSON_LIST_SELECT = `
  id,
  slug,
  title,
  description,
  thumbnail_url,
  cefr_level,
  category,
  estimated_minutes,
  xp_reward,
  published_at,
  units(title, courses(title))
`;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function trimFilter(value: string | undefined, maxLength = 80) {
  return value?.trim().slice(0, maxLength) ?? "";
}

function sanitizeIlikeValue(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLessonLevel(value: string): value is CefrLevel {
  return LESSON_LEVELS.includes(value as (typeof LESSON_LEVELS)[number]);
}

function isLessonCategory(value: string): value is LessonCategory {
  return LESSON_CATEGORIES.includes(
    value as (typeof LESSON_CATEGORIES)[number],
  );
}

export function parseLessonFilters(
  searchParams: Record<string, string | string[] | undefined>,
): LessonFilters {
  const level = trimFilter(firstParam(searchParams.level));
  const category = trimFilter(firstParam(searchParams.category));

  return {
    q: trimFilter(firstParam(searchParams.q)),
    level: isLessonLevel(level) ? level : "all",
    category: isLessonCategory(category) ? category : "all",
  };
}

function lessonSortQuery(
  supabase: SupabaseClient<Database>,
  filters?: LessonFilters,
) {
  let query = supabase
    .from("lessons")
    .select(LESSON_LIST_SELECT)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order("order_index", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });

  if (filters?.q) {
    const search = sanitizeIlikeValue(filters.q);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
  }

  if (filters?.level !== undefined && filters.level !== "all") {
    query = query.eq("cefr_level", filters.level);
  }

  if (filters?.category !== undefined && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  return query;
}

function getNestedTitle(
  value: unknown,
  key: "units" | "courses",
): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const nested = record[key];
  if (Array.isArray(nested)) {
    return getTitle(nested[0]);
  }

  return getTitle(nested);
}

function getTitle(value: unknown): string | null {
  return typeof value === "object" &&
    value !== null &&
    typeof (value as { title?: unknown }).title === "string"
    ? (value as { title: string }).title
    : null;
}

function toLessonListItem(
  row: LessonRow & { units?: unknown },
  questionCount = 0,
): LessonListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    cefr_level: row.cefr_level,
    category: row.category,
    estimated_minutes: row.estimated_minutes,
    xp_reward: row.xp_reward,
    published_at: row.published_at,
    unitTitle: getNestedTitle(row, "units"),
    courseTitle:
      typeof row.units === "object" && row.units !== null
        ? getNestedTitle(row.units, "courses")
        : null,
    questionCount,
  };
}

export async function getPublishedLessons(
  supabase: SupabaseClient<Database>,
  filters?: LessonFilters,
  options?: LessonQueryOptions,
) {
  const safeLimit =
    options?.limit && Number.isInteger(options.limit)
      ? Math.min(Math.max(options.limit, 1), 100)
      : null;
  const safeOffset =
    options?.offset && Number.isInteger(options.offset)
      ? Math.max(options.offset, 0)
      : 0;
  let query = lessonSortQuery(supabase, filters);

  if (safeLimit) {
    query = query.range(safeOffset, safeOffset + safeLimit - 1);
  }

  const { data, error } = await query;

  if (error) {
    return { lessons: [] as LessonListItem[], error: error.message };
  }

  const lessonIds = (data ?? []).map((lesson) => lesson.id);
  const questionCounts = await getQuestionCounts(supabase, lessonIds);

  return {
    lessons: (data ?? []).map((lesson) =>
      toLessonListItem(
        lesson as LessonRow & { units?: unknown },
        questionCounts.get(lesson.id) ?? 0,
      ),
    ),
    error: null,
  };
}

export async function getFeaturedLessons({
  supabase,
  limit = 3,
}: {
  supabase: SupabaseClient<Database>;
  limit?: number;
}) {
  const { lessons, error } = await getPublishedLessons(supabase, undefined, {
    limit: Math.max(limit * 4, limit),
  });
  if (error || lessons.length === 0) {
    return { lessons, error };
  }

  return {
    lessons: [...lessons]
      .sort((a, b) => {
        return (
          b.questionCount - a.questionCount ||
          (b.published_at ?? "").localeCompare(a.published_at ?? "") ||
          a.title.localeCompare(b.title)
        );
      })
      .slice(0, limit),
    error: null,
  };
}

async function getQuestionCounts(
  supabase: SupabaseClient<Database>,
  lessonIds: string[],
) {
  const counts = new Map<string, number>();
  if (lessonIds.length === 0) {
    return counts;
  }

  const { data } = await supabase
    .from("quiz_questions")
    .select("lesson_id")
    .in("lesson_id", lessonIds);

  data?.forEach((row) => {
    counts.set(row.lesson_id, (counts.get(row.lesson_id) ?? 0) + 1);
  });

  return counts;
}

export async function getPublishedLessonBySlug({
  supabase,
  slug,
}: {
  supabase: SupabaseClient<Database>;
  slug: string;
}) {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`${LESSON_LIST_SELECT}, meta_title, meta_description, passing_score`)
    .eq("slug", slug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) {
    return { lesson: null, error: error.message };
  }

  if (!lesson) {
    return { lesson: null, error: null };
  }

  const [contents, quizQuestions] = await Promise.all([
    getLessonContents(supabase, lesson.id),
    getLessonQuizQuestions(supabase, lesson.id),
  ]);

  const detail: LessonDetail = {
    ...toLessonListItem(
      lesson as LessonRow & { units?: unknown },
      quizQuestions.length,
    ),
    meta_title: lesson.meta_title,
    meta_description: lesson.meta_description,
    passing_score: lesson.passing_score,
    contents,
    quizQuestions,
  };

  return { lesson: detail, error: null };
}

async function getLessonContents(
  supabase: SupabaseClient<Database>,
  lessonId: string,
) {
  const { data } = await supabase
    .from("lesson_contents")
    .select("id, block_type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  return (data ?? [])
    .map((row: Pick<LessonContentRow, "id" | "block_type" | "content">) =>
      parseLessonContentBlock({
        id: row.id,
        blockType: row.block_type,
        content: row.content,
      }),
    )
    .filter((block): block is LessonContentBlock => block !== null);
}

async function getLessonQuizQuestions(
  supabase: SupabaseClient<Database>,
  lessonId: string,
) {
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question, type, points, order_index, explanation")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: true });

  if (!questions?.length) {
    return [];
  }

  const questionIds = questions.map((question) => question.id);
  const { data: options } = await supabase
    .from("public_quiz_options")
    .select("id, question_id, content, order_index")
    .in("question_id", questionIds)
    .order("order_index", { ascending: true });

  const optionsByQuestion = new Map<
    string,
    Pick<PublicQuizOptionRow, "id" | "content" | "order_index">[]
  >();

  options?.forEach((option) => {
    if (!option.question_id) {
      return;
    }

    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push({
      id: option.id,
      content: option.content,
      order_index: option.order_index,
    });
    optionsByQuestion.set(option.question_id, list);
  });

  return questions.map((question) => ({
    ...question,
    options: optionsByQuestion.get(question.id) ?? [],
  }));
}
