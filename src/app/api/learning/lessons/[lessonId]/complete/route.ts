import { NextResponse } from "next/server";

import {
  apiRequestErrorResponse,
  getOptionalInteger,
  readJsonObject,
} from "@/lib/api/request";
import { getApiUser } from "@/lib/auth/api";
import {
  completeLessonForUser,
  learningRpcErrorResponse,
} from "@/lib/learning/server-rpc";

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
    const studyTimeSeconds = getOptionalInteger(body, "studyTimeSeconds") ?? 0;
    const { lessonId } = await params;
    const result = await completeLessonForUser({
      userId: user.id,
      lessonId,
      studyTimeSeconds,
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
