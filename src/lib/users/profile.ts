import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import type { Database } from "@/types/supabase";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type UserIdentity = {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: ProfileRow["role"];
};

export type InitialUserProfile = {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type DashboardProfileSummary = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: ProfileRow["role"];
  preferred_cefr_level: ProfileRow["preferred_cefr_level"];
};

export const PROFILE_IDENTITY_SELECT =
  "display_name, username, avatar_url, role";

export const DASHBOARD_PROFILE_SELECT =
  "display_name, username, avatar_url, role, preferred_cefr_level";

function toUserIdentity(profile: Pick<
  ProfileRow,
  "display_name" | "username" | "avatar_url" | "role"
> | null): UserIdentity | null {
  if (!profile) {
    return null;
  }

  return {
    displayName: profile.display_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    role: profile.role,
  };
}

function toDashboardProfileSummary(
  profile: Pick<
    ProfileRow,
    | "display_name"
    | "username"
    | "avatar_url"
    | "role"
    | "preferred_cefr_level"
  > | null,
): DashboardProfileSummary | null {
  return profile;
}

export const getUserIdentity = cache(async function getUserIdentity(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_IDENTITY_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return {
    identity: error ? null : toUserIdentity(data),
    error,
  };
});

export const getDashboardProfile = cache(async function getDashboardProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(DASHBOARD_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: error ? null : toDashboardProfileSummary(data),
    error,
  };
});
