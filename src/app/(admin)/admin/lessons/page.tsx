import Link from "next/link";
import { Pencil } from "lucide-react";

import LessonEditorForm from "@/components/admin/LessonEditorForm";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminLessons } from "@/lib/learning/lesson-admin";
import { saveLessonAction } from "./actions";

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const { supabase } = await requireAdmin("/admin/lessons");
  const { lessons, error } = await getAdminLessons(supabase);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Lessons & Quiz</h1>
            <p className="mt-2 text-muted-foreground">
              เพิ่มบทเรียน เผยแพร่ SEO page และสร้าง quiz จากหลังบ้าน
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Admin home</Link>
          </Button>
        </header>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            โหลดรายการบทเรียนไม่สำเร็จ
          </p>
        )}
        {deleted === "1" && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            ลบ lesson แล้ว
          </p>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">All lessons</h2>
          {lessons.length === 0 ? (
            <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
              ยังไม่มี lesson ในระบบ
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="bg-card">
                      <td className="px-4 py-3">
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.courseTitle || "Engleet"} ·{" "}
                          {lesson.unitTitle || "Foundation"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{lesson.status}</td>
                      <td className="px-4 py-3">
                        {lesson.cefr_level ?? "-"} · {lesson.category}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(lesson.updated_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {lesson.status === "published" && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/learn/lessons/${lesson.slug}`}>
                                View
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/lessons/${lesson.id}/edit`}>
                              <Pencil />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Create lesson</h2>
          <LessonEditorForm action={saveLessonAction} />
        </section>
      </div>
    </main>
  );
}
