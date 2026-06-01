import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Layers3,
  Newspaper,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LEARNING_PATHS = [
  {
    title: "Lessons",
    description: "บทเรียนสั้นพร้อม quiz ที่ผู้ดูแลเพิ่มและเผยแพร่ได้",
    href: "/learn/lessons",
    icon: <BookOpen className="size-5" />,
    meta: "Read + quiz",
    tone: "primary",
  },
  {
    title: "Vocabulary",
    description: "คลังคำศัพท์พร้อมคำแปล ตัวอย่างประโยค และระบบบันทึกคำ",
    href: "/learn/vocabulary",
    icon: <Tags className="size-5" />,
    meta: "Browse + flashcards",
    tone: "accent",
  },
  {
    title: "News",
    description: "ฝึกอ่านบทความจริง พร้อมต่อยอดไปยังคำศัพท์และ TTS",
    href: "/news",
    icon: <Newspaper className="size-5" />,
    meta: "Real-world English",
    tone: "secondary",
  },
] as const;

const LOOP_STEPS = [
  { icon: <BookOpen className="size-4" />, label: "เรียนสั้น ๆ" },
  { icon: <CheckCircle2 className="size-4" />, label: "ตอบ quiz" },
  { icon: <Layers3 className="size-4" />, label: "ทบทวน flashcards" },
  { icon: <Flame className="size-4" />, label: "รักษา streak" },
];

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="surface-panel overflow-hidden">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_18rem] md:p-8">
            <div className="space-y-5">
              <p className="eyebrow">
                <Sparkles className="size-4" />
                Learn
              </p>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
                  เริ่มเรียนภาษาอังกฤษกับ Engleet
                </h1>
                <p className="max-w-2xl leading-7 text-muted-foreground">
                  อ่านบทเรียน ฝึกคำศัพท์ และทำ quiz เพื่อสะสม XP เนื้อหาบางส่วนเปิดอ่านได้ทันที
                  ส่วนคะแนนและ progress จะบันทึกเมื่อเข้าสู่ระบบ
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/learn/lessons"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  เริ่มบทเรียน
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/learn/vocabulary?view=flashcards"
                  className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary/35 hover:bg-muted"
                >
                  เปิด Flashcards
                </Link>
              </div>
            </div>

            <div className="rounded-lg border bg-background/70 p-4">
              <p className="text-sm font-medium">Today loop</p>
              <div className="mt-4 grid gap-2">
                {LOOP_STEPS.map((step, index) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-lg bg-card px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {step.icon}
                    </span>
                    <span className="font-medium">{step.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {LEARNING_PATHS.map((path) => (
            <LearningCard
              key={path.href}
              title={path.title}
              description={path.description}
              href={path.href}
              icon={path.icon}
              meta={path.meta}
              tone={path.tone}
            />
          ))}
        </section>

        <section className="surface-panel grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="icon-tile">
            <Search className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Quick lookup anywhere</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              คลุมคำศัพท์หรือประโยคภาษาอังกฤษบนหน้าเว็บเพื่อเปิด popup แปลคำ
              และกดต่อไปยังหน้า vocabulary ได้ทันที
            </p>
          </div>
          <Link
            href="/learn/vocabulary"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            ดูคำศัพท์
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function LearningCard({
  title,
  description,
  href,
  icon,
  meta,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  meta: string;
  tone: "primary" | "secondary" | "accent";
}) {
  return (
    <Link href={href} className="interactive-card group p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("icon-tile", toneClasses[tone])}>{icon}</div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">
              {meta}
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
} as const;
