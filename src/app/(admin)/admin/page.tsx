import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  await requireAdmin("/admin");

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            จัดการเนื้อหา Engleet
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            พื้นที่สำหรับผู้ดูแลระบบในการจัดการบทเรียน quiz และเนื้อหาหลักของเว็บ
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <AdminCard
            href="/admin/lessons"
            icon={<BookOpen className="size-5" />}
            title="Lessons & Quiz"
            description="เพิ่มบทเรียน เนื้อหา SEO และคำถาม quiz ที่ผูกกับ lesson"
          />
          <AdminCard
            href="/dashboard"
            icon={<LayoutDashboard className="size-5" />}
            title="Dashboard"
            description="กลับไปดูหน้าสรุป progress และสถานะบัญชี"
          />
        </section>
      </div>
    </main>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5">
        <Link href={href}>Open</Link>
      </Button>
    </div>
  );
}
