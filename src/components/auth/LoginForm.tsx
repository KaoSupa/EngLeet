"use client";

import { useState } from "react";
import { getRoleFromAppMetadata } from "@/lib/auth/claims";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SubmitButton, Divider, Field, ErrorMessage, SuccessMessage } from "./UI";
import GoogleLogin from "./GoogleLogin";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getRequestedRedirect() {
    return searchParams.get("next");
  }

  function getRedirectAfterLogin(appMetadata: unknown) {
    return getPostAuthRedirect(
      getRequestedRedirect(),
      getRoleFromAppMetadata(appMetadata),
    );
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("อีเมลไม่ถูกต้อง");
      return;
    }

    if (!password) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    router.push(getRedirectAfterLogin(data.user?.app_metadata));
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับมา</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
        {searchParams.get("password_reset") === "success" && (
          <SuccessMessage message="ตั้งรหัสผ่านใหม่สำเร็จแล้ว โปรดเข้าสู่ระบบอีกครั้ง" />
        )}
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
