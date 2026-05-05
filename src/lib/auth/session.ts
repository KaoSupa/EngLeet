import { redirect } from "next/navigation";
import { getRoleFromClaims, getStringClaim } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = getStringClaim(claims, "sub");

  if (error || !userId) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const user = {
    id: userId,
    email: getStringClaim(claims, "email"),
    role: getRoleFromClaims(claims),
  };

  return { supabase, user };
}

export async function requireAdmin(next = "/admin") {
  const { supabase, user } = await requireUser(next);
  let profile: { role: "user" | "admin" } | null = user.role
    ? { role: user.role }
    : null;

  if (!profile) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
}
