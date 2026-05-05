import type { Database } from "@/types/supabase";

export type AppRole = Database["public"]["Enums"]["user_role"];

export function getStringClaim(
  claims: Record<string, unknown> | undefined,
  key: string,
) {
  const value = claims?.[key];

  return typeof value === "string" ? value : null;
}

export function getRoleFromAppMetadata(metadata: unknown): AppRole | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).role;

  return value === "admin" || value === "user" ? value : null;
}

export function getRoleFromClaims(
  claims: Record<string, unknown> | undefined,
) {
  return getRoleFromAppMetadata(claims?.app_metadata);
}
