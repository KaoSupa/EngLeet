import Link from "next/link";
import { notFound } from "next/navigation";

import DeleteLessonButton from "@/components/admin/DeleteLessonButton";
import LessonEditorForm from "@/components/admin/LessonEditorForm";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getLessonEditorInitialData } from "@/lib/learning/lesson-admin";
import { deleteLessonAction, saveLessonAction } from "../../actions";

type EditLessonPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditLessonPage({
  params,
  searchParams,
}: EditLessonPageProps) {
  const { lessonId } = await params;
  const { saved } = await searchParams;
  const { supabase } = await requireAdmin(`/admin/lessons/${lessonId}/edit`);
  const initialData = await getLessonEditorInitialData({ supabase, lessonId });

  if (!initialData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Edit lesson</h1>
            <p className="mt-2 text-muted-foreground">{initialData.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {initialData.slug && (
              <Button asChild variant="outline">
                <Link href={`/learn/lessons/${initialData.slug}`}>View public</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/admin/lessons">Lessons</Link>
            </Button>
            <DeleteLessonButton
              action={deleteLessonAction}
              lessonId={lessonId}
              lessonTitle={initialData.title ?? "Untitled lesson"}
            />
          </div>
        </header>

        {saved === "1" && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            บันทึกแล้ว
          </p>
        )}

        <LessonEditorForm action={saveLessonAction} initialData={initialData} />
      </div>
    </main>
  );
}
