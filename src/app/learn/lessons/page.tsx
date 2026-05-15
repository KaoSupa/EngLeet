import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";

import LessonFilters from "@/components/lessons/LessonFilters";
import SafeImage from "@/components/media/SafeImage";
import {
  getLearningBadgeTone,
  LearningBadge,
} from "@/components/ui/learning-badge";
import { getPublishedLessons } from "@/lib/learning/lessons";
import { parseLessonFilters } from "@/lib/learning/lessons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lessons | Engleet",
  description: "เรียนภาษาอังกฤษแบบเป็นบทเรียน พร้อม quiz และ XP",
};

type LessonsPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: LessonsPageSearchParams;
}) {
  const filters = parseLessonFilters(await searchParams);
  const supabase = await createClient();
  const { lessons, error } = await getPublishedLessons(supabase, filters);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-medium text-primary">Lessons</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            เรียนเป็นบทสั้น ทำ quiz แล้วเก็บ XP
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            เลือกบทเรียนตามระดับและหัวข้อที่อยากฝึก เนื้อหาหน้านี้เปิดอ่านได้
            ส่วน progress และคะแนน quiz จะถูกบันทึกเมื่อเข้าสู่ระบบ
          </p>
        </section>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            โหลดบทเรียนไม่สำเร็จ
          </div>
        )}

        <LessonFilters filters={filters} total={lessons.length} />

        {lessons.length === 0 ? (
          <EmptyLessons />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/lessons/${lesson.slug}`}
                className="group flex min-h-64 flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-colors hover:bg-muted/40"
              >
                {lesson.thumbnail_url ? (
                  <div className="relative h-36 w-full bg-muted">
                    <SafeImage
                      src={lesson.thumbnail_url}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center bg-muted">
                    <BookOpen className="size-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {lesson.cefr_level && (
                      <LearningBadge tone={getLearningBadgeTone(lesson.cefr_level)}>
                        {lesson.cefr_level}
                      </LearningBadge>
                    )}
                    <LearningBadge tone="category">
                      {lesson.category}
                    </LearningBadge>
                  </div>

                  <h2 className="mt-4 text-lg font-semibold group-hover:text-primary">
                    {lesson.title}
                  </h2>
                  {lesson.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-4" />
                      {lesson.estimated_minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="size-4" />
                      {lesson.xp_reward} XP
                    </span>
                    <span>{lesson.questionCount} quiz</span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function EmptyLessons() {
  return (
    <section className="rounded-lg border bg-card p-8">
      <h2 className="text-xl font-semibold">ยังไม่มีบทเรียนที่เผยแพร่</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        เมื่อผู้ดูแลเพิ่มและ publish lesson แล้ว รายการจะปรากฏที่นี่ทันที
      </p>
    </section>
  );
}
