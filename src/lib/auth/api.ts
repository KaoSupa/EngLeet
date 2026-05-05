import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getStringClaim(
  claims: Record<string, unknown> | undefined,
  key: string,
) {
  const value = claims?.[key];

  return typeof value === "string" ? value : null;
}

export async function getApiUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = getStringClaim(claims, "sub");

  if (error || !userId) {
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    response: null,
    user: {
      id: userId,
      email: getStringClaim(claims, "email"),
    },
  };
}
