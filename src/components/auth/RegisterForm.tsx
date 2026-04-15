"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubmitButton, Divider, Field, ErrorMessage } from "./UI";
import GoogleLogin from "./GoogleLogin";

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?message=check_email");
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
        <Field
          label="อีเมล"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
        />
        <Field
          label="รหัสผ่าน"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="อย่างน้อย 8 ตัวอักษร"
        />
        <Field
          label="ยืนยันรหัสผ่าน"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
        />
        <SubmitButton
          loading={loading}
          label="สมัครสมาชิก"
          loadingLabel="กำลังสมัคร..."
        />
      </form>

      <Divider />

      <GoogleLogin label="สมัครด้วย Google" />

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
