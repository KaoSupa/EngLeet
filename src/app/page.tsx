import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookMarked,
  Brain,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

import AuthErrorRedirect from "@/components/auth/AuthErrorRedirect";
import HeroCarousel from "@/components/landing/HeroCarousel";
import SafeImage from "@/components/media/SafeImage";
import { Button } from "@/components/ui/button";
import {
  getLearningBadgeTone,
  LearningBadge,
} from "@/components/ui/learning-badge";
import {
  getFeaturedLessons,
  type LessonListItem,
} from "@/lib/learning/lessons";
import { createPublicDataClient } from "@/lib/supabase/public";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export default async function Home() {
  const featuredLessons = await getHomeFeaturedLessons();

  return (
    <main className="bg-transparent">
      <AuthErrorRedirect />
      <HeroCarousel />

      <section className="border-b bg-background/80 px-4 py-12 backdrop-blur sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <FeatureStat
            icon={<Flame />}
            value="Daily"
            label="streak rhythm"
            tone="primary"
          />
          <FeatureStat
            icon={<Trophy />}
            value="XP"
            label="reward loop"
            tone="secondary"
          />
          <FeatureStat
            icon={<Brain />}
            value="Quiz"
            label="active recall"
            tone="accent"
          />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <p className="eyebrow">
              <Sparkles className="size-4" />
              Learning system
            </p>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
              ทำให้การเรียนอังกฤษรู้สึกเบา แต่มีความคืบหน้าจริง
            </h2>
            <p className="max-w-xl leading-7 text-muted-foreground">
              Engleet วาง lesson, vocabulary, news และ quiz ให้อยู่ในระบบเดียวกัน
              เพื่อให้ผู้เรียนเห็นผลต่อเนื่อง ไม่ต้องเริ่มใหม่ทุกครั้งที่เปิดเว็บ
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/learn">
                  เปิดหน้าเรียน
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/learn/vocabulary">สำรวจคำศัพท์</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeaturePanel
              icon={<GraduationCap />}
              title="บทเรียนสั้น"
              description="เนื้อหาถูกแบ่งเป็นตอนเล็ก เหมาะกับการเรียนบนมือถือหรือช่วงเวลาสั้น ๆ"
              tone="primary"
            />
            <FeaturePanel
              icon={<BookMarked />}
              title="คลังคำศัพท์กลาง"
              description="คำศัพท์เดียวผูกกับ lesson, news และ popup แปลคำจากการคลุมข้อความได้"
              tone="accent"
            />
            <FeaturePanel
              icon={<Search />}
              title="ค้นและทบทวน"
              description="ค้นคำศัพท์ แปลความหมาย และบันทึกคำที่อยากกลับมาฝึกซ้ำได้"
              tone="secondary"
            />
            <FeaturePanel
              icon={<Sparkles />}
              title="แรงจูงใจ"
              description="XP, streak และ progress ทำให้การฝึกภาษาเป็นกิจวัตรที่จับต้องได้"
              tone="primary"
            />
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/45 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="eyebrow">
                <GraduationCap className="size-4" />
                Featured lessons
              </p>
              <h2 className="text-3xl font-semibold">
                บทเรียนแนะนำ
              </h2>
              <p className="max-w-2xl leading-7 text-muted-foreground">
                Lesson ที่ publish แล้วจะแสดงที่นี่อัตโนมัติ เพื่อพาผู้เรียนไปยังเนื้อหาได้เร็ว
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/learn/lessons">
                ดูทั้งหมด
                <ChevronRight />
              </Link>
            </Button>
          </div>

          {featuredLessons.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {featuredLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/learn/lessons/${lesson.slug}`}
                  className="interactive-card group overflow-hidden"
                >
                  {lesson.thumbnail_url ? (
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      <SafeImage
                        src={lesson.thumbnail_url}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-primary text-primary-foreground">
                      <GraduationCap className="size-10" />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
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
                    <h3 className="text-lg font-semibold transition group-hover:text-primary">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-4" />
                        {lesson.estimated_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-4" />
                        {lesson.xp_reward} XP
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="surface-panel p-6">
              <h3 className="font-semibold">ยังไม่มี lesson ที่ publish</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                เมื่อ admin publish lesson แล้ว section นี้จะแสดงบทเรียนแนะนำโดยอัตโนมัติ
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-lg border bg-foreground text-background shadow-xl shadow-primary/10">
            <div className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
              <div className="space-y-3">
                <h2 className="text-balance text-3xl font-semibold">
                  พร้อมเริ่มเรียนแบบมีระบบแล้วหรือยัง?
                </h2>
                <p className="max-w-2xl text-background/75">
                  สมัครฟรีเพื่อบันทึก progress, streak, XP และคำศัพท์ที่อยากทบทวน
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-white text-black hover:bg-white/90">
                  <Link href="/register">สมัครใช้งาน</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/learn">ดูเนื้อหา</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getHomeFeaturedLessons(): Promise<LessonListItem[]> {
  try {
    const supabase = createPublicDataClient();
    const { lessons } = await getFeaturedLessons({
      supabase,
      limit: 3,
    });

    return lessons;
  } catch {
    return [];
  }
}

function FeatureStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone: "primary" | "secondary" | "accent";
}) {
  return (
    <div className="interactive-card flex items-center gap-4 p-5">
      <div className={cn("icon-tile", toneClasses[tone])}>{icon}</div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FeaturePanel({
  icon,
  title,
  description,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone: "primary" | "secondary" | "accent";
}) {
  return (
    <div className="interactive-card p-5">
      <div className={cn("icon-tile", toneClasses[tone])}>{icon}</div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
} as const;
