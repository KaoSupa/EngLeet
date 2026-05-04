import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getStringClaim(
  claims: Record<string, unknown> | undefined,
  key: string,
) {
  const value = claims?.[key];

  return typeof value === "string" ? value : null;
}

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
  };

  return { supabase, user };
}

export async function requireAdmin(next = "/admin") {
  const { supabase, user } = await requireUser(next);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
}
