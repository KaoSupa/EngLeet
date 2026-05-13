export const DEFAULT_SITE_URL = "https://www.engleet.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl() {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL,
  );
}

export function buildAuthCallbackUrl({
  origin,
  next,
}: {
  origin: string;
  next?: string | null;
}) {
  const callbackUrl = new URL("/auth/callback", origin);

  if (next) {
    callbackUrl.searchParams.set("next", next);
  }

  return callbackUrl.toString();
}

export function getEmailDomainConfig() {
  const siteUrl = getSiteUrl();
  const hostname = new URL(siteUrl).hostname;

  return {
    siteUrl,
    authEmailDomain: process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? hostname,
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? `support@${hostname}`,
    senderEmail:
      process.env.NEXT_PUBLIC_AUTH_SENDER_EMAIL ?? `noreply@${hostname}`,
  };
}
