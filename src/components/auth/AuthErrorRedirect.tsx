"use client";

import { useEffect } from "react";

function getOAuthErrorFromUrl() {
  const queryError = new URLSearchParams(window.location.search).get("error");
  if (queryError) {
    return queryError;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash).get("error");
}

export default function AuthErrorRedirect() {
  useEffect(() => {
    const error = getOAuthErrorFromUrl();

    if (!error) {
      return;
    }

    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set(
      "error",
      error === "access_denied" ? "oauth_cancelled" : error,
    );
    window.location.replace(loginUrl.toString());
  }, []);

  return null;
}
