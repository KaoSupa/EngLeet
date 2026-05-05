import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api";
import { getDashboardSummary } from "@/lib/dashboard/summary";

export async function GET() {
  const auth = await getApiUser();

  if (auth.response) {
    return auth.response;
  }

  const { summary, error } = await getDashboardSummary(
    auth.supabase,
    auth.user.id,
  );

  if (error) {
    return NextResponse.json(
      { error: "Unable to load dashboard summary" },
      { status: 500 },
    );
  }

  return NextResponse.json(summary);
}
