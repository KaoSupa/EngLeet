import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parseLessonContentBlock,
  type LessonContentBlock,
} from "@/lib/learning/lesson-content";
import type { LessonEditorInitialData } from "@/components/admin/LessonEditorForm";
import type { Database } from "@/types/supabase";

type QuizOptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];

const ADMIN_LESSON_SELECT = `
  id,
  title,
  slug,
  description,
  thumbnail_url,
  category,
  cefr_level,
  status,
  estimated_minutes,
  xp_reward,
  passing_score,
  meta_title,
  meta_description,
  created_at,
  updated_at,
  units(title, courses(title))
`;

function nestedTitle(value: unknown, key: "units" | "courses") {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  const nested = (value as Record<string, unknown>)[key];
  const target = Array.isArray(nested) ? nested[0] : nested;
  return typeof target === "object" &&
    target !== null &&
    typeof (target as { title?: unknown }).title === "string"
    ? (target as { title: string }).title
    : "";
}

export async function getAdminLessons(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("lessons")
    .select(ADMIN_LESSON_SELECT)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return { lessons: [], error: error.message };
  }

  return {
    lessons: (data ?? []).map((lesson) => ({
      ...lesson,
      unitTitle: nestedTitle(lesson, "units"),
      courseTitle:
        typeof lesson.units === "object" && lesson.units !== null
          ? nestedTitle(lesson.units, "courses")
          : "",
    })),
    error: null,
  };
}

export async function getLessonEditorInitialData({
  supabase,
  lessonId,
}: {
  supabase: SupabaseClient<Database>;
  lessonId: string;
}): Promise<LessonEditorInitialData | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select(ADMIN_LESSON_SELECT)
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) {
    return null;
  }

  const [{ data: contents }, { data: questions }] = await Promise.all([
    supabase
      .from("lesson_contents")
      .select("id, block_type, content, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
    supabase
      .from("quiz_questions")
      .select("id, question, type, points, explanation, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
  ]);

  const blocks = (contents ?? [])
    .map((block) =>
      parseLessonContentBlock({
        id: block.id,
        blockType: block.block_type,
        content: block.content,
      }),
    )
    .filter((block): block is LessonContentBlock => block !== null);
  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: options } =
    questionIds.length > 0
      ? await supabase
          .from("quiz_options")
          .select("id, question_id, content, feedback, is_correct, order_index")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true })
      : { data: [] as QuizOptionRow[] };
  const optionsByQuestion = new Map<string, QuizOptionRow[]>();

  options?.forEach((option) => {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push(option);
    optionsByQuestion.set(option.question_id, list);
  });

  const textBlock = blocks.find((block) => block.type === "text");
  const calloutBlock = blocks.find((block) => block.type === "callout");
  const imageBlock = blocks.find((block) => block.type === "image");
  const videoBlock = blocks.find((block) => block.type === "video");

  return {
    lessonId: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description ?? "",
    thumbnailUrl: lesson.thumbnail_url ?? "",
    category: lesson.category,
    cefrLevel: lesson.cefr_level ?? "A1",
    status: lesson.status,
    estimatedMinutes: lesson.estimated_minutes,
    xpReward: lesson.xp_reward,
    passingScore: lesson.passing_score,
    metaTitle: lesson.meta_title ?? "",
    metaDescription: lesson.meta_description ?? "",
    courseTitle:
      typeof lesson.units === "object" && lesson.units !== null
        ? nestedTitle(lesson.units, "courses")
        : "Engleet Core",
    unitTitle: nestedTitle(lesson, "units") || "Foundation",
    body: textBlock?.type === "text" ? textBlock.text : "",
    callout: calloutBlock?.type === "callout" ? calloutBlock.text : "",
    imageUrl: imageBlock?.type === "image" ? imageBlock.url : "",
    imageAlt: imageBlock?.type === "image" ? imageBlock.alt : "",
    imageCaption: imageBlock?.type === "image" ? imageBlock.caption : "",
    videoUrl: videoBlock?.type === "video" ? videoBlock.url : "",
    videoCaption: videoBlock?.type === "video" ? videoBlock.caption : "",
    questions: (questions ?? []).map((question) => {
      const questionOptions = optionsByQuestion.get(question.id) ?? [];
      const correctIndex = Math.max(
        0,
        questionOptions.findIndex((option) => option.is_correct),
      );

      return {
        id: question.id,
        text: question.question,
        type: question.type,
        points: question.points,
        correctIndex,
        explanation: question.explanation ?? "",
        options: [
          ...questionOptions.map((option) => option.content),
          "",
          "",
          "",
          "",
        ].slice(0, 4),
      };
    }),
  };
}
