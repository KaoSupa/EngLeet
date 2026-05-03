"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./UI";

interface GoogleLoginProps {
  label: string;
  getRedirectTarget: () => string;
  onError: (message: string) => void;
}

export default function GoogleLogin({
  label,
  getRedirectTarget,
  onError,
}: GoogleLoginProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    onError("");

    const redirectTo = getRedirectTarget();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      onError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ โปรดลองอีกครั้ง");
      setLoading(false);
    }
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
