"use client";

import { useState } from "react";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SubmitButton,
  Divider,
  Field,
  ErrorMessage,
  SuccessMessage,
} from "./UI";
import GoogleLogin from "./GoogleLogin";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function getRedirectTarget() {
    return getSafeRedirectPath(
      new URLSearchParams(window.location.search).get("next"),
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@")) {
      setError("อีเมลไม่ถูกต้อง");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);

    const redirectTo = getRedirectTarget();
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setSuccess("สมัครสมาชิกสำเร็จ โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">สมัครสมาชิก</h1>
        <p className="text-sm text-muted-foreground">
          เริ่มต้นเรียนภาษาอังกฤษวันนี้
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}
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
          name="new-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          autoComplete="new-password"
        />
        <Field
          label="ยืนยันรหัสผ่าน"
          name="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <SubmitButton
          loading={loading}
          label="สมัครสมาชิก"
          loadingLabel="กำลังสมัคร..."
        />
      </form>

      <Divider />

      <GoogleLogin
        label="สมัครด้วย Google"
        getRedirectTarget={getRedirectTarget}
        onError={setError}
      />

      <p className="text-center text-sm text-muted-foreground">
        มีบัญชีแล้ว?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
