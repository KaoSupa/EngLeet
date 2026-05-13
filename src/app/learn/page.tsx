import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Newspaper, Search, Tags } from "lucide-react";

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-medium text-primary">Learn</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            เริ่มเรียนภาษาอังกฤษกับ Engleet
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            อ่านบทเรียน ฝึกคำศัพท์ และทำ quiz เพื่อสะสม XP
            เนื้อหาบางส่วนเปิดอ่านได้ทันที ส่วนคะแนนและ progress จะบันทึกเมื่อเข้าสู่ระบบ
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LearningCard
            title="Lessons"
            description="บทเรียนแบบสั้นพร้อม quiz ที่ผู้ดูแลเพิ่มและเผยแพร่ได้"
            href="/learn/lessons"
            icon={<BookOpen className="size-5" />}
          />
          <LearningCard
            title="Vocabulary"
            description="คลังคำศัพท์พร้อมคำแปล ตัวอย่างประโยค และระบบบันทึกคำ"
            href="/learn/vocabulary"
            icon={<Tags className="size-5" />}
          />
          <LearningCard
            title="Dictionary"
            description="ค้นคำศัพท์และดูรายละเอียดเพื่อใช้กับข่าวหรือบทเรียน"
            href="/dictionary"
            icon={<Search className="size-5" />}
          />
          <LearningCard
            title="News"
            description="Read real-world English articles and prepare for vocabulary extraction and TTS."
            href="/news"
            icon={<Newspaper className="size-5" />}
          />
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
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">{icon}</div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
