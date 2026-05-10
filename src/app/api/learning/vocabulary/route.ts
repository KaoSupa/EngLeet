import { NextResponse } from "next/server";

import {
  getOptionalApiUser,
  getVocabularyPageData,
  parseVocabularyFilters,
} from "@/lib/learning/vocabulary";
import { createClient } from "@/lib/supabase/server";

function searchParamsToRecord(searchParams: URLSearchParams) {
  const record: Record<string, string | string[] | undefined> = {};

  searchParams.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

function parseOffset(value: string | null) {
  const offset = Number.parseInt(value ?? "0", 10);
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = parseVocabularyFilters(searchParamsToRecord(url.searchParams));
  const offset = parseOffset(url.searchParams.get("offset"));
  const supabase = await createClient();
  const user = await getOptionalApiUser(supabase);
  const data = await getVocabularyPageData({
    supabase,
    filters,
    userId: user?.id ?? null,
    offset,
    includeTags: false,
  });

  return NextResponse.json({
    items: data.items,
    savedVocabularyIds: data.savedVocabularyIds,
    total: data.total,
    error: data.error,
  });
}
