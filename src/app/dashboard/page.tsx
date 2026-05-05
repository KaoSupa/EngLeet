import DashboardSummary from "@/components/dashboard/DashboardSummary";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user } = await requireUser("/dashboard");

  if (user.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <DashboardSummary initialEmail={user.email} />
      </div>
    </main>
  );
}
