import { NextResponse } from "next/server";

import {
  apiRequestErrorResponse,
  getRequiredInteger,
  readJsonObject,
} from "@/lib/api/request";
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
