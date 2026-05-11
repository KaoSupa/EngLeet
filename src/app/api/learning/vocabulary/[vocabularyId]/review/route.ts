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
  reviewVocabularyForUser,
} from "@/lib/learning/server-rpc";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vocabularyId: string }> },
) {
  const { response, user } = await getApiUser();
  if (response) {
    return response;
  }

  try {
    assertRateLimit({
      key: getRateLimitIdentity({
        prefix: "vocabulary-review",
        userId: user.id,
      }),
      limit: 90,
      windowMs: 60_000,
    });
    const body = await readJsonObject(request);
    const quality = getRequiredInteger(body, "quality");
    const { vocabularyId } = await params;
    const result = await reviewVocabularyForUser({
      userId: user.id,
      vocabularyId,
      quality,
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
