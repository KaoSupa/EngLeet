import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(next = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

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
