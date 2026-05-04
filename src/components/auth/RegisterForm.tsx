"use client";

import { useState } from "react";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function getRequestedRedirect() {
    return searchParams.get("next");
  }

  async function getRedirectAfterRegister(userId: string | undefined) {
    if (!userId) {
      return getPostAuthRedirect(getRequestedRedirect(), null);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    return getPostAuthRedirect(getRequestedRedirect(), profile?.role);
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

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const requestedRedirect = getRequestedRedirect();

    if (requestedRedirect) {
      callbackUrl.searchParams.set("next", requestedRedirect);
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(
        "ไม่สามารถสมัครสมาชิกได้ โปรดตรวจสอบข้อมูลหรือเข้าสู่ระบบหากมีบัญชีอยู่แล้ว",
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(await getRedirectAfterRegister(data.user?.id));
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
        getRequestedRedirect={getRequestedRedirect}
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
