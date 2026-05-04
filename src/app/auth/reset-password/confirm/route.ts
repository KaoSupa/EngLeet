import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const fallback = type === "recovery" ? "/reset-password" : "/dashboard";
  const next = getSafeRedirectPath(searchParams.get("next"), fallback);

  if (!tokenHash || !type || !EMAIL_OTP_TYPES.has(type as EmailOtpType)) {
    return NextResponse.redirect(
      new URL(`${fallback}?error=invalid_auth_link`, origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`${fallback}?error_code=otp_expired`, origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
