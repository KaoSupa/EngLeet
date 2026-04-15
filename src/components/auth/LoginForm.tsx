"use client";

import { useState } from "react";
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

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold ">เข้าสู่ระบบ</h1>
        <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับมา</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
          placeholder="••••••••"
        />
        <SubmitButton
          loading={loading}
          label="เข้าสู่ระบบ"
          loadingLabel="กำลังเข้าสู่ระบบ..."
        />
      </form>

      <Divider />

      <GoogleLogin label="เข้าสู่ระบบด้วย Google" />

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
