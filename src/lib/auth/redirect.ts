export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const INTERNAL_REDIRECT_BASE = "http://localhost";

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
