import { NextResponse } from "next/server";

import { apiRequestErrorResponse } from "@/lib/api/request";
import { assertRateLimit, getRateLimitIdentity } from "@/lib/api/rate-limit";
import { getApiUser } from "@/lib/auth/api";
import {
  learningRpcErrorResponse,
  saveVocabularyForUser,
} from "@/lib/learning/server-rpc";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ vocabularyId: string }> },
) {
  const { response, user } = await getApiUser();
  if (response) {
    return response;
  }

  try {
    await assertRateLimit({
      key: getRateLimitIdentity({
        prefix: "vocabulary-save",
        userId: user.id,
      }),
      limit: 60,
      windowMs: 60_000,
    });
    const { vocabularyId } = await params;
    const result = await saveVocabularyForUser({
      userId: user.id,
      vocabularyId,
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
