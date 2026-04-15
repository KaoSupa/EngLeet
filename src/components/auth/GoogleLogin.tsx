"use client";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./UI";

interface GoogleLoginProps {
  label?: string;
}

export default function GoogleLogin({ label }: GoogleLoginProps) {
  const supabase = createClient();

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}
