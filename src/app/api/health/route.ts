import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("vocabulary")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          database: "error",
          latency_ms: Date.now() - startedAt,
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        database: "ok",
        latency_ms: Date.now() - startedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
        latency_ms: Date.now() - startedAt,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
