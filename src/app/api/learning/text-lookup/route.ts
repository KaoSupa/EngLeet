import { NextResponse } from "next/server";

import {
  apiRequestErrorResponse,
  ApiRequestError,
} from "@/lib/api/request";
import { assertRateLimit } from "@/lib/api/rate-limit";
import {
  lookupSelectedText,
  MAX_TEXT_LOOKUP_LENGTH,
} from "@/lib/learning/text-lookup";
import { createPublicDataClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

function getClientIdentity(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export async function GET(request: Request) {
  try {
    await assertRateLimit({
      key: `text-lookup:${getClientIdentity(request)}`,
      limit: 120,
      windowMs: 60_000,
    });

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      throw new ApiRequestError("Selected text is too short");
    }

    if (query.length > MAX_TEXT_LOOKUP_LENGTH) {
      throw new ApiRequestError("Selected text is too long");
    }

    const supabase = createPublicDataClient();
    const result = await lookupSelectedText({ supabase, text: query });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const requestErrorResponse = apiRequestErrorResponse(error);
    if (requestErrorResponse) {
      return requestErrorResponse;
    }

    return NextResponse.json(
      { error: "Unable to look up selected text" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
