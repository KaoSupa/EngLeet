import { NextResponse } from "next/server";

import {
  apiRequestErrorResponse,
  getOptionalInteger,
  jsonBadRequest,
  readJsonObject,
} from "@/lib/api/request";
import { getApiUser } from "@/lib/auth/api";
import {
  learningRpcErrorResponse,
  submitLessonQuizForUser,
} from "@/lib/learning/server-rpc";
import type { Json } from "@/types/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { response, user } = await getApiUser();
  if (response) {
    return response;
  }

  try {
    const body = await readJsonObject(request);
    const answers = body.answers;
    const timeTakenSeconds = getOptionalInteger(body, "timeTakenSeconds") ?? 0;

    if (!Array.isArray(answers)) {
      return jsonBadRequest("answers must be an array");
    }

    const { lessonId } = await params;
    const result = await submitLessonQuizForUser({
      userId: user.id,
      lessonId,
      answers: answers as Json,
      timeTakenSeconds,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const requestErrorResponse = apiRequestErrorResponse(error);
    if (requestErrorResponse) {
      return requestErrorResponse;
    }

    return learningRpcErrorResponse(error);
  }
}
