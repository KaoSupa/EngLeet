"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage, Field, SubmitButton, SuccessMessage } from "./UI";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const linkError = {
    invalid_reset_link: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง โปรดขอลิงก์ใหม่อีกครั้ง",
    reset_link_expired:
      "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว โปรดขอลิงก์ใหม่อีกครั้ง",
    reset_session_required:
      "โปรดเปิดลิงก์จากอีเมลรีเซ็ตรหัสผ่านก่อนตั้งรหัสผ่านใหม่",
  }[searchParams.get("error") ?? ""];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

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
        {(error || linkError) && <ErrorMessage message={error || linkError || ""} />}
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
