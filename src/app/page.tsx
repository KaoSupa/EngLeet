import AuthErrorRedirect from "@/components/auth/AuthErrorRedirect";
import { redirect } from "next/navigation";

type HomeSearchParams = Promise<{
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeOAuthError(error: string) {
  return error === "access_denied" ? "oauth_cancelled" : error;
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const error = firstParam(params.error);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(normalizeOAuthError(error))}`);
  }

  return <AuthErrorRedirect />;
}
