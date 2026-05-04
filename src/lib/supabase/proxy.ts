import { createServerClient } from "@supabase/ssr";
import {
  ADMIN_AUTH_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
  getPostAuthRedirect,
  getSafeRedirectPath,
} from "@/lib/auth/redirect";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login", "/register", "/forgot-password"];
const protectedRoutes = ["/dashboard", "/profile", "/settings", "/admin"];
const adminRoutes = ["/admin"];
const userDashboardRoutes = [DEFAULT_AUTH_REDIRECT];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;

  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && matchesRoute(pathname, protectedRoutes)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", getSafeRedirectPath(`${pathname}${search}`));
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (matchesRoute(pathname, adminRoutes) ||
      matchesRoute(pathname, authRoutes) ||
      matchesRoute(pathname, userDashboardRoutes))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (matchesRoute(pathname, adminRoutes) && profile?.role !== "admin") {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }

    if (
      matchesRoute(pathname, userDashboardRoutes) &&
      profile?.role === "admin"
    ) {
      return NextResponse.redirect(new URL(ADMIN_AUTH_REDIRECT, request.url));
    }

    if (matchesRoute(pathname, authRoutes)) {
      const next = getPostAuthRedirect(
        request.nextUrl.searchParams.get("next"),
        profile?.role,
      );

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return supabaseResponse;
}
