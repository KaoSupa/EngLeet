import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

import StudyTimeTracker from "@/components/activity/StudyTimeTracker";
import CompleteLessonButton from "@/components/lessons/CompleteLessonButton";
import LessonContentBlocks from "@/components/lessons/LessonContentBlocks";
import LessonQuiz from "@/components/lessons/LessonQuiz";
import LessonViewAnalytics from "@/components/lessons/LessonViewAnalytics";
import SafeImage from "@/components/media/SafeImage";
import {
  getLearningBadgeTone,
  LearningBadge,
} from "@/components/ui/learning-badge";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  getPublishedLessonBySlug,
  getUserLessonProgress,
} from "@/lib/learning/lessons";
import { createClient } from "@/lib/supabase/server";

type LessonRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: LessonRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { lesson } = await getPublishedLessonBySlug({ supabase, slug });

  if (!lesson) {
    return { title: "Lesson | Engleet" };
  }

  return {
    title: lesson.meta_title || `${lesson.title} | Engleet`,
    description: lesson.meta_description || lesson.description || undefined,
  };
}

export default async function LessonDetailPage({ params }: LessonRouteProps) {
  const { slug } = await params;
  const [{ user }, publicClient] = await Promise.all([
    getAuthenticatedSession(),
    createClient(),
  ]);
  const { lesson } = await getPublishedLessonBySlug({
    supabase: publicClient,
    slug,
  });

  if (!lesson) {
    notFound();
  }

  const { progress } = user
    ? await getUserLessonProgress({
        supabase: publicClient,
        userId: user.id,
        lessonId: lesson.id,
      })
    : { progress: null };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <LessonViewAnalytics
        lessonId={lesson.id}
        slug={lesson.slug}
        category={lesson.category}
        level={lesson.cefr_level}
      />
      {user && <StudyTimeTracker />}
      <article className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <Link
            href="/learn/lessons"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Lessons
          </Link>

          <header className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {lesson.cefr_level && (
                <LearningBadge tone={getLearningBadgeTone(lesson.cefr_level)}>
                  {lesson.cefr_level}
                </LearningBadge>
              )}
              <LearningBadge tone="category">
                {lesson.category}
              </LearningBadge>
              {lesson.unitTitle && (
                <LearningBadge tone="source">
                  {lesson.unitTitle}
                </LearningBadge>
              )}
            </div>

            <h1 className="text-3xl font-semibold sm:text-5xl">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </header>

          {lesson.thumbnail_url && (
            <div className="relative aspect-[16/9] max-h-[440px] overflow-hidden rounded-lg border bg-muted">
              <SafeImage
                src={lesson.thumbnail_url}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <LessonContentBlocks blocks={lesson.contents} />

          <LessonQuiz
            lessonId={lesson.id}
            questions={lesson.quizQuestions}
            passingScore={lesson.passing_score}
            isAuthenticated={Boolean(user)}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Lesson reward</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Metric
                  icon={<Clock className="size-4" />}
                  label="Minutes"
                  value={lesson.estimated_minutes}
                />
                <Metric
                  icon={<Sparkles className="size-4" />}
                  label="XP"
                  value={lesson.xp_reward}
                />
              </div>
            </div>

            <CompleteLessonButton
              lessonId={lesson.id}
              isAuthenticated={Boolean(user)}
              initialCompleted={progress?.status === "completed"}
              xpReward={lesson.xp_reward}
              estimatedMinutes={lesson.estimated_minutes}
            />
          </div>
        </aside>
      </article>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
