import { NextResponse } from "next/server";

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
    const { vocabularyId } = await params;
    const result = await saveVocabularyForUser({
      userId: user.id,
      vocabularyId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return learningRpcErrorResponse(error);
  }
}
