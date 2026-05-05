import { createServerClient } from "@supabase/ssr";
import {
  getPostAuthRedirect,
  getSafeRedirectPath,
} from "@/lib/auth/redirect";
import { getRoleFromClaims, getStringClaim } from "@/lib/auth/claims";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

const authRoutes = ["/login", "/register", "/forgot-password"];
const protectedRoutes = ["/dashboard", "/profile", "/settings", "/admin"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
    );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = matchesRoute(pathname, authRoutes);
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const hasAuthCookie = hasSupabaseAuthCookie(request);
  const shouldCheckSession = isAuthRoute && hasAuthCookie;

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", getSafeRedirectPath(`${pathname}${search}`));
    return NextResponse.redirect(loginUrl);
  }

  if (!shouldCheckSession) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = error ? null : getStringClaim(claims, "sub");

  if (userId && isAuthRoute) {
    let role = getRoleFromClaims(claims);

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      role = profile?.role ?? null;
    }

    const next = getPostAuthRedirect(
      request.nextUrl.searchParams.get("next"),
      role,
    );

    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}
