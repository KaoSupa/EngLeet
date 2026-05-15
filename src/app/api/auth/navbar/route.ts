import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth/session";
import { getUserIdentity } from "@/lib/users/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user } = await getAuthenticatedSession();

  if (!user) {
    return navbarResponse({ user: null });
  }

  const { identity } = await getUserIdentity(supabase, user.id);
  const displayName =
    identity?.displayName ?? identity?.username ?? user.email ?? "Learner";
  const role = identity?.role === "admin" || user.role === "admin"
    ? "admin"
    : "user";

  return navbarResponse({
    user: {
      displayName,
      email: user.email,
      avatarUrl: identity?.avatarUrl ?? null,
      role,
    },
  });
}

function navbarResponse(body: {
  user: {
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
    role: "user" | "admin";
  } | null;
}) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
