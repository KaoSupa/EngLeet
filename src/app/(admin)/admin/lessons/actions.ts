"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertRateLimit, getRateLimitIdentity } from "@/lib/api/rate-limit";
import { requireAdmin } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/types/supabase";

type CefrLevel = Database["public"]["Enums"]["cefr_level"];
type ContentStatus = Database["public"]["Enums"]["content_status"];
type LessonCategory = Database["public"]["Enums"]["lesson_category"];
type QuizType = Database["public"]["Enums"]["quiz_type"];
type ContentBlockType = Database["public"]["Enums"]["content_block_type"];

export type LessonFormState = {
  error: string | null;
};

const CATEGORIES: readonly LessonCategory[] = [
  "vocabulary",
  "grammar",
  "pronunciation",
  "listening",
  "reading",
  "writing",
  "speaking",
  "conversation",
];
const LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES: readonly ContentStatus[] = ["draft", "published", "archived"];
const QUIZ_TYPES: readonly QuizType[] = ["multiple_choice", "true_false"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getUuid(formData: FormData, key: string) {
  const value = formString(formData, key, 80);
  if (!UUID_RE.test(value)) {
    throw new Error("Invalid lesson id");
  }

  return value;
}

function formNumber(
  formData: FormData,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const value = Number.parseInt(formString(formData, key, 12), 10);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function enumValue<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T,
) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function nullableUrl(value: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function contentBlock(block_type: ContentBlockType, content: Json) {
  return { block_type, content };
}

function buildContentBlocks(formData: FormData) {
  const blocks: { block_type: ContentBlockType; content: Json }[] = [];
  const body = formString(formData, "body", 20000);
  const callout = formString(formData, "callout", 3000);
  const imageUrl = nullableUrl(formString(formData, "imageUrl", 2048));
  const videoUrl = nullableUrl(formString(formData, "videoUrl", 2048));

  if (body) {
    blocks.push(contentBlock("text", { text: body }));
  }

  if (callout) {
    blocks.push(contentBlock("callout", { title: "Key idea", text: callout }));
  }

  if (imageUrl) {
    blocks.push(
      contentBlock("image", {
        url: imageUrl,
        alt: formString(formData, "imageAlt", 160),
        caption: formString(formData, "imageCaption", 240),
      }),
    );
  }

  if (videoUrl) {
    blocks.push(
      contentBlock("video", {
        url: videoUrl,
        caption: formString(formData, "videoCaption", 240),
      }),
    );
  }

  return blocks;
}

type ParsedQuestion = {
  question: string;
  type: QuizType;
  explanation: string | null;
  points: number;
  options: {
    content: string;
    feedback: string | null;
    is_correct: boolean;
  }[];
};

function parseQuestions(formData: FormData) {
  const questionCount = formNumber(formData, "questionCount", 0, 0, 20);
  const questions: ParsedQuestion[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const question = formString(formData, `question.${index}.text`, 1000);
    if (!question) {
      continue;
    }

    const type = enumValue(
      formString(formData, `question.${index}.type`, 40),
      QUIZ_TYPES,
      "multiple_choice",
    );
    const points = formNumber(formData, `question.${index}.points`, 1, 1, 20);
    const correctIndex = formNumber(
      formData,
      `question.${index}.correctIndex`,
      0,
      0,
      3,
    );
    const options =
      type === "true_false"
        ? ["True", "False"]
        : [0, 1, 2, 3].map((optionIndex) =>
            formString(
              formData,
              `question.${index}.option.${optionIndex}`,
              400,
            ),
          );

    const cleanOptions = options
      .map((content, optionIndex) => ({
        content,
        feedback: null,
        is_correct: optionIndex === correctIndex,
      }))
      .filter((option) => option.content);

    if (cleanOptions.length < 2) {
      continue;
    }

    if (!cleanOptions.some((option) => option.is_correct)) {
      cleanOptions[0].is_correct = true;
    }

    questions.push({
      question,
      type,
      points,
      explanation: formString(
        formData,
        `question.${index}.explanation`,
        1000,
      ) || null,
      options: cleanOptions,
    });
  }

  return questions;
}

export async function saveLessonAction(
  _prevState: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const { user } = await requireAdmin("/admin/lessons");
  assertRateLimit({
    key: getRateLimitIdentity({
      prefix: "admin-lesson-save",
      userId: user.id,
    }),
    limit: 30,
    windowMs: 60_000,
  });

  try {
    const lessonId = formString(formData, "lessonId", 80);
    const title = formString(formData, "title", 180);
    if (!title) {
      return { error: "กรุณาใส่ชื่อบทเรียน" };
    }

    const level = enumValue(formString(formData, "cefrLevel", 16), LEVELS, "A1");
    const intent = formString(formData, "intent", 24);
    const selectedStatus = enumValue(
      formString(formData, "status", 24),
      STATUSES,
      "draft",
    );
    const status = intent === "publish" ? "published" : selectedStatus;
    const category = enumValue(
      formString(formData, "category", 40),
      CATEGORIES,
      "vocabulary",
    );
    const courseTitle = formString(formData, "courseTitle", 160) || "Engleet Core";
    const unitTitle = formString(formData, "unitTitle", 160) || "Foundation";
    const supabase = createServiceClient();

    const lessonPayload = {
      id: lessonId || null,
      title,
      slug: slugify(formString(formData, "slug", 180) || title),
      course_title: courseTitle,
      unit_title: unitTitle,
      description: formString(formData, "description", 800) || null,
      thumbnail_url: nullableUrl(formString(formData, "thumbnailUrl", 2048)),
      category,
      cefr_level: level,
      status,
      estimated_minutes: formNumber(formData, "estimatedMinutes", 10, 1, 600),
      xp_reward: formNumber(formData, "xpReward", 25, 0, 10000),
      passing_score: formNumber(formData, "passingScore", 70, 0, 100),
      meta_title: formString(formData, "metaTitle", 180) || null,
      meta_description: formString(formData, "metaDescription", 220) || null,
    };
    const blocks = buildContentBlocks(formData);
    const questions = parseQuestions(formData);

    const { data: savedLessonId, error: rpcError } = await supabase.rpc(
      "server_admin_upsert_lesson_bundle",
      {
        p_admin_user_id: user.id,
        p_lesson: lessonPayload,
        p_content_blocks: blocks,
        p_questions: questions.map((question, index) => ({
          ...question,
          order_index: index,
          options: question.options.map((option, optionIndex) => ({
            ...option,
            order_index: optionIndex,
          })),
        })),
      },
    );

    if (rpcError || !savedLessonId) {
      return {
        error: rpcError?.message ?? "Unable to save lesson",
      };
    }

    revalidatePath("/learn");
    revalidatePath("/learn/lessons");
    revalidatePath("/admin/lessons");
    redirect(`/admin/lessons/${savedLessonId}/edit?saved=1`);
  } catch (error) {
    const digest =
      typeof error === "object" && error !== null && "digest" in error
        ? String((error as { digest?: unknown }).digest)
        : "";

    if (digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกบทเรียนได้",
    };
  }
}

export async function deleteLessonAction(formData: FormData) {
  const { user } = await requireAdmin("/admin/lessons");
  assertRateLimit({
    key: getRateLimitIdentity({
      prefix: "admin-lesson-delete",
      userId: user.id,
    }),
    limit: 10,
    windowMs: 60_000,
  });

  const lessonId = getUuid(formData, "lessonId");
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("server_admin_delete_lesson_bundle", {
    p_admin_user_id: user.id,
    p_lesson_id: lessonId,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/learn");
  revalidatePath("/learn/lessons");
  revalidatePath("/admin/lessons");
  redirect("/admin/lessons?deleted=1");
}
