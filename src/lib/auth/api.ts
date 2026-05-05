import { NextResponse } from "next/server";

import { getRoleFromClaims, getStringClaim } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";

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
    supabase,
    user: {
      id: userId,
      email: getStringClaim(claims, "email"),
      role: getRoleFromClaims(claims),
    },
  };
}
