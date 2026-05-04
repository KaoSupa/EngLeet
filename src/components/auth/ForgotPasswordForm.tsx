"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage, Field, SubmitButton, SuccessMessage } from "./UI";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError("ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง");
      return;
    }

    setSuccess("ถ้าอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ");
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">ลืมรหัสผ่าน</h1>
        <p className="text-sm text-muted-foreground">
          กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <SubmitButton
          loading={loading}
          label="ส่งลิงก์รีเซ็ตรหัสผ่าน"
          loadingLabel="กำลังส่ง..."
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        จำรหัสผ่านได้แล้ว?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
