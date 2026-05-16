import { NextResponse } from "next/server";

import {
  apiRequestErrorResponse,
  getRequiredInteger,
  readJsonObject,
} from "@/lib/api/request";
import { assertRateLimit, getRateLimitIdentity } from "@/lib/api/rate-limit";
import { getApiUser } from "@/lib/auth/api";
import {
  learningRpcErrorResponse,
  recordStudyActivityForUser,
} from "@/lib/learning/server-rpc";

const MAX_STUDY_TIME_SECONDS = 300;

export async function POST(request: Request) {
  const { response, user } = await getApiUser();
  if (response) {
    return response;
  }

  try {
    await assertRateLimit({
      key: getRateLimitIdentity({
        prefix: "study-activity",
        userId: user.id,
      }),
      limit: 20,
      windowMs: 60_000,
    });

    const body = await readJsonObject(request);
    const studyTimeSeconds = getRequiredInteger(body, "studyTimeSeconds");

    if (studyTimeSeconds < 1 || studyTimeSeconds > MAX_STUDY_TIME_SECONDS) {
      return NextResponse.json(
        { error: "studyTimeSeconds must be between 1 and 300" },
        { status: 400 },
      );
    }

    const result = await recordStudyActivityForUser({
      userId: user.id,
      studyTimeSeconds,
    });

    return NextResponse.json(result);
  } catch (error) {
    const requestErrorResponse = apiRequestErrorResponse(error);
    if (requestErrorResponse) {
      return requestErrorResponse;
    }

    return learningRpcErrorResponse(error);
  }
}
