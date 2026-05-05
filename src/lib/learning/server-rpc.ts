import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class LearningRpcError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "LearningRpcError";
  }
}

function assertUuid(value: string, name: string) {
  if (!UUID_RE.test(value)) {
    throw new LearningRpcError(`${name} is invalid`);
  }
}

function getRpcErrorStatus(message: string) {
  if (message.includes("Authentication required")) {
    return 401;
  }

  if (message.includes("Please wait")) {
    return 429;
  }

  if (message.includes("not available") || message.includes("not found")) {
    return 404;
  }

  return 400;
}

function toLearningRpcError(error: { message: string }) {
  return new LearningRpcError(error.message, getRpcErrorStatus(error.message));
}

export function learningRpcErrorResponse(error: unknown) {
  if (error instanceof LearningRpcError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: "Unable to complete learning action" },
    { status: 500 },
  );
}

export async function completeLessonForUser({
  userId,
  lessonId,
  studyTimeSeconds = 0,
}: {
  userId: string;
  lessonId: string;
  studyTimeSeconds?: number;
}) {
  assertUuid(userId, "userId");
  assertUuid(lessonId, "lessonId");

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("server_complete_lesson", {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_study_time_seconds: studyTimeSeconds,
  });

  if (error) {
    throw toLearningRpcError(error);
  }

  return data?.[0] ?? null;
}

export async function saveVocabularyForUser({
  userId,
  vocabularyId,
}: {
  userId: string;
  vocabularyId: string;
}) {
  assertUuid(userId, "userId");
  assertUuid(vocabularyId, "vocabularyId");

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("server_save_vocabulary", {
    p_user_id: userId,
    p_vocabulary_id: vocabularyId,
  });

  if (error) {
    throw toLearningRpcError(error);
  }

  return { ok: true };
}

export async function reviewVocabularyForUser({
  userId,
  vocabularyId,
  quality,
}: {
  userId: string;
  vocabularyId: string;
  quality: number;
}) {
  assertUuid(userId, "userId");
  assertUuid(vocabularyId, "vocabularyId");

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("server_review_vocabulary", {
    p_user_id: userId,
    p_vocabulary_id: vocabularyId,
    p_quality: quality,
  });

  if (error) {
    throw toLearningRpcError(error);
  }

  return { ok: true };
}

export async function submitLessonQuizForUser({
  userId,
  lessonId,
  answers,
  timeTakenSeconds = 0,
}: {
  userId: string;
  lessonId: string;
  answers: Json;
  timeTakenSeconds?: number;
}) {
  assertUuid(userId, "userId");
  assertUuid(lessonId, "lessonId");

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("server_submit_lesson_quiz", {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_answers: answers,
    p_time_taken_seconds: timeTakenSeconds,
  });

  if (error) {
    throw toLearningRpcError(error);
  }

  return data?.[0] ?? null;
}
