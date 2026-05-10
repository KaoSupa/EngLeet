"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./UI";

interface GoogleLoginProps {
  label: string;
  getRequestedRedirect: () => string | null;
  onError: (message: string) => void;
}

export default function GoogleLogin({
  label,
  getRequestedRedirect,
  onError,
}: GoogleLoginProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function resetLoading() {
      setLoading(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        resetLoading();
      }
    }

    window.addEventListener("pageshow", resetLoading);
    window.addEventListener("focus", resetLoading);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetLoading);
      window.removeEventListener("focus", resetLoading);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleGoogleLogin() {
    if (loading) {
      return;
    }

    setLoading(true);
    onError("");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const requestedRedirect = getRequestedRedirect();

    if (requestedRedirect) {
      callbackUrl.searchParams.set("next", requestedRedirect);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      onError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ โปรดลองอีกครั้ง");
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    onError("ไม่สามารถเปิดหน้าเข้าสู่ระบบ Google ได้ โปรดลองอีกครั้ง");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon />
      {loading ? "กำลังเปิด Google..." : label}
    </button>
  );
}
