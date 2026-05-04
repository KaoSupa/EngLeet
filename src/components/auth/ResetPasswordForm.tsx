"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage, Field, SubmitButton, SuccessMessage } from "./UI";

export function ResetPasswordForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const linkError =
    searchParams.get("error_code") === "otp_expired"
      ? "ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว โปรดขอลิงก์ใหม่อีกครั้ง"
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("ลิงก์ไม่ถูกต้องหรือหมดอายุ โปรดขอลิงก์ใหม่อีกครั้ง");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess("ตั้งรหัสผ่านใหม่สำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว");
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-sm text-muted-foreground">
          ใส่รหัสผ่านใหม่สำหรับบัญชีของคุณ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || linkError) && <ErrorMessage message={error || linkError} />}
        {success && <SuccessMessage message={success} />}
        <Field
          label="รหัสผ่านใหม่"
          name="new-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          autoComplete="new-password"
        />
        <Field
          label="ยืนยันรหัสผ่านใหม่"
          name="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <SubmitButton
          loading={loading}
          label="บันทึกรหัสผ่านใหม่"
          loadingLabel="กำลังบันทึก..."
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ต้องการลิงก์ใหม่?{" "}
        <Link
          href="/forgot-password"
          className="text-primary hover:underline font-medium"
        >
          ขอรีเซ็ตรหัสผ่านอีกครั้ง
        </Link>
      </p>
    </div>
  );
}
