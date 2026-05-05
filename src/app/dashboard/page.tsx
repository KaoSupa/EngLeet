import DashboardSummary from "@/components/dashboard/DashboardSummary";
import { requireUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/dashboard/summary";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser("/dashboard");
  const { summary, error } = await getDashboardSummary(supabase, user.id);

  if (user.role === "admin" || summary.profile?.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <DashboardSummary
          summary={summary}
          summaryError={
            error ? "โหลดข้อมูล Dashboard ไม่สำเร็จ โปรดลองใหม่อีกครั้ง" : null
          }
        />
      </div>
    </main>
  );
}
