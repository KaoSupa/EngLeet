import DashboardSummary from "@/components/dashboard/DashboardSummary";
import { requireUser } from "@/lib/auth/session";
import { getUserIdentity } from "@/lib/users/profile";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser("/dashboard");
  const { identity } = await getUserIdentity(supabase, user.id);

  if (user.role === "admin" || identity?.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <DashboardSummary
          initialProfile={{
            displayName: identity?.displayName ?? null,
            username: identity?.username ?? null,
            avatarUrl: identity?.avatarUrl ?? null,
          }}
        />
      </div>
    </main>
  );
}
