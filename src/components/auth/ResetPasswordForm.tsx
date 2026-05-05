"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_TEXT,
  validatePasswordStrength,
} from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage, Field, SubmitButton, SuccessMessage } from "./UI";

export function ResetPasswordForm() {
  const router = useRouter();
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

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
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

    await fetch("/auth/reset-password/complete", {
      method: "POST",
    });
    setSuccess("ตั้งรหัสผ่านใหม่สำเร็จ");
    router.replace("/login?password_reset=success");
    router.refresh();
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
          placeholder="อย่างน้อย 12 ตัวอักษร"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          helpText={PASSWORD_REQUIREMENTS_TEXT}
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
