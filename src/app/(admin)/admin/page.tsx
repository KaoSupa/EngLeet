import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireAdmin("/admin");

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold">จัดการเนื้อหา Engleet</h1>
          <p className="text-muted-foreground">
            เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าหน้านี้ได้
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            พื้นที่นี้จะต่อยอดเป็นระบบจัดการคอร์ส บทเรียน คำศัพท์ และ quiz
          </p>
        </div>

        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          กลับ Dashboard
        </Link>
      </div>
    </main>
  );
}
