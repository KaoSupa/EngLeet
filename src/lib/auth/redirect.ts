export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const ADMIN_AUTH_REDIRECT = "/admin";

const INTERNAL_REDIRECT_BASE = "http://localhost";

export function getDefaultRedirectForRole(role: string | null | undefined) {
  return role === "admin" ? ADMIN_AUTH_REDIRECT : DEFAULT_AUTH_REDIRECT;
}

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_REDIRECT_BASE);

    if (url.origin !== INTERNAL_REDIRECT_BASE) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getPostAuthRedirect(
  value: string | null | undefined,
  role: string | null | undefined,
) {
  const fallback = getDefaultRedirectForRole(role);
  const redirectPath = getSafeRedirectPath(value, fallback);

  if (
    role === "admin" &&
    (redirectPath === DEFAULT_AUTH_REDIRECT ||
      redirectPath.startsWith(`${DEFAULT_AUTH_REDIRECT}/`))
  ) {
    return ADMIN_AUTH_REDIRECT;
  }

  return redirectPath;
}
