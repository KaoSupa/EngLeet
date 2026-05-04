"use client";

import { useState } from "react";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubmitButton, Divider, Field, ErrorMessage } from "./UI";
import GoogleLogin from "./GoogleLogin";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getRequestedRedirect() {
    return new URLSearchParams(window.location.search).get("next");
  }

  async function getRedirectAfterLogin() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .maybeSingle();

    return getPostAuthRedirect(getRequestedRedirect(), profile?.role);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    router.push(await getRedirectAfterLogin());
    router.refresh();
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับมา</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <Field
          label="อีเมล"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          autoComplete="email"
        />
        <Field
          label="รหัสผ่าน"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
        <SubmitButton
          loading={loading}
          label="เข้าสู่ระบบ"
          loadingLabel="กำลังเข้าสู่ระบบ..."
        />
      </form>

      <Divider />

      <GoogleLogin
        label="เข้าสู่ระบบด้วย Google"
        getRequestedRedirect={getRequestedRedirect}
        onError={setError}
      />

      <p className="text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/register"
          className="text-primary hover:underline font-medium"
        >
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
