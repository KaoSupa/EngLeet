import { NextRequest, NextResponse } from "next/server";

import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_VALUE,
  PASSWORD_RECOVERY_MAX_AGE_SECONDS,
} from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");

  if (!tokenHash) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=invalid_reset_link", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=reset_link_expired", origin),
    );
  }

  const response = NextResponse.redirect(new URL("/reset-password", origin));
  response.cookies.set(
    PASSWORD_RECOVERY_COOKIE,
    PASSWORD_RECOVERY_COOKIE_VALUE,
    {
      httpOnly: true,
      maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  return response;
}
