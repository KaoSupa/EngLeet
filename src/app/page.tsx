import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
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
  getFeaturedLessons,
  getPublishedLessons,
  type LessonListItem,
} from "@/lib/learning/lessons";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type HomeSearchParams = Promise<{
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeOAuthError(error: string) {
  return error === "access_denied" ? "oauth_cancelled" : error;
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const error = firstParam(params.error);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(normalizeOAuthError(error))}`);
  }

  const featuredLessons = await getHomeFeaturedLessons();

  return (
    <main className="bg-background">
      <AuthErrorRedirect />
      <HeroCarousel />

      <section className="border-b bg-background px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <FeatureStat icon={<Flame />} value="Daily" label="streak rhythm" />
          <FeatureStat icon={<Trophy />} value="XP" label="reward loop" />
          <FeatureStat icon={<Brain />} value="Quiz" label="active recall" />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">Learning system</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ทำให้การเรียนอังกฤษรู้สึกเบา แต่มีความคืบหน้าจริง
            </h2>
            <p className="text-muted-foreground">
              Engleet วาง lesson, vocabulary และ quiz ให้อยู่ในระบบเดียวกัน
              เพื่อให้ผู้เรียนเห็นผลต่อเนื่อง ไม่ต้องเริ่มใหม่ทุกครั้งที่เปิดเว็บ
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeaturePanel
              icon={<GraduationCap />}
              title="บทเรียนสั้น"
              description="เนื้อหาถูกแบ่งเป็นตอนเล็ก เหมาะกับการเรียนบนมือถือหรือช่วงเวลาสั้นๆ"
            />
            <FeaturePanel
              icon={<BookMarked />}
              title="คลังคำศัพท์กลาง"
              description="คำศัพท์เดียวสามารถผูกกับ lesson, dictionary และ content อื่นในอนาคต"
            />
            <FeaturePanel
              icon={<Search />}
              title="ค้นและทบทวน"
              description="ค้นคำศัพท์ แปลความหมาย และบันทึกคำที่อยากกลับมาฝึกซ้ำได้"
            />
            <FeaturePanel
              icon={<Sparkles />}
              title="แรงจูงใจ"
              description="XP, streak และ progress ช่วยให้การฝึกภาษาเป็นกิจวัตรที่จับต้องได้"
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/45 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">Featured lessons</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                บทเรียนแนะนำ
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Lesson ที่ publish แล้วจะแสดงที่นี่อัตโนมัติ เพื่อให้หน้าแรกพาผู้เรียนไปยังเนื้อหาได้เร็ว
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
                  className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-colors hover:bg-background"
                >
                  {lesson.thumbnail_url ? (
                    <div className="relative h-40 w-full bg-muted">
                      <SafeImage
                        src={lesson.thumbnail_url}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-foreground text-background">
                      <GraduationCap className="size-10" />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {lesson.cefr_level && (
                        <span className="rounded-md border px-2 py-1">
                          {lesson.cefr_level}
                        </span>
                      )}
                      <span className="rounded-md border px-2 py-1">
                        {lesson.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-4" />
                        {lesson.estimated_minutes} min
                      </span>
                      <span>{lesson.xp_reward} XP</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6">
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
          <div className="overflow-hidden rounded-lg border bg-foreground text-background">
            <div className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-tight">
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
    const supabase = createServiceClient();
    const { lessons } = await getFeaturedLessons({
      supabase,
      limit: 3,
    });

    return lessons;
  } catch {
    const supabase = await createClient();
    const { lessons } = await getPublishedLessons(supabase);
    return lessons.slice(0, 3);
  }
}

function FeatureStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </div>
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
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
