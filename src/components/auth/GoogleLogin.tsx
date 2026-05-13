"use client";

import { useEffect, useState } from "react";
import { buildAuthCallbackUrl } from "@/lib/config/site";
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

    const requestedRedirect = getRequestedRedirect();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildAuthCallbackUrl({
          origin: window.location.origin,
          next: requestedRedirect,
        }),
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
