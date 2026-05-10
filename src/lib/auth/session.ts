import { redirect } from "next/navigation";
import { cache } from "react";
import { getRoleFromClaims, getStringClaim } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_IDENTITY_SELECT } from "@/lib/users/profile";

const getAuthenticatedSession = cache(async function getAuthenticatedSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = getStringClaim(claims, "sub");

  if (error || !userId) {
    return { supabase, user: null };
  }

  const user = {
    id: userId,
    email: getStringClaim(claims, "email"),
    role: getRoleFromClaims(claims),
  };

  return { supabase, user };
});

export async function requireUser(next = "/dashboard") {
  const { supabase, user } = await getAuthenticatedSession();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user };
}

export const requireAdmin = cache(async function requireAdmin(next = "/admin") {
  const { supabase, user } = await requireUser(next);
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_IDENTITY_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
});
