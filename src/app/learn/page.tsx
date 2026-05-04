import Link from "next/link";

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">Learn</p>
          <h1 className="text-3xl font-semibold">เริ่มเรียนภาษาอังกฤษ</h1>
          <p className="max-w-2xl text-muted-foreground">
            สำรวจบทเรียน คำศัพท์ และแบบฝึกหัดได้ฟรี เมื่ออยากบันทึกคำศัพท์
            ทำ quiz หรือเก็บ XP ระบบจะให้เข้าสู่ระบบก่อน
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <LearningCard
            title="Courses"
            description="เรียนเป็นเส้นทางจากง่ายไปยากตามระดับ CEFR"
            href="/learn/courses"
          />
          <LearningCard
            title="Vocabulary"
            description="เปิดคลังคำศัพท์พร้อมคำแปล ตัวอย่าง และเสียงอ่าน"
            href="/learn/vocabulary"
          />
          <LearningCard
            title="Dictionary"
            description="ค้นหาคำศัพท์และดูรายละเอียดก่อนบันทึกเข้าคลังของคุณ"
            href="/dictionary"
          />
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">ทำไมหน้านี้เปิด public?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            เนื้อหาเรียนรู้ควรเปิดให้ค้นหาและแชร์ได้เพื่อช่วย SEO และลด friction
            สำหรับผู้เรียนใหม่ ส่วนข้อมูลส่วนตัวอย่าง progress, streak, saved
            vocabulary และ quiz score จะยังต้องเข้าสู่ระบบเสมอ
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ไป Dashboard
          </Link>
          <Link
            href="/register"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            สมัครเพื่อบันทึกความคืบหน้า
          </Link>
        </div>
      </div>
    </main>
  );
}

function LearningCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border bg-card p-5 shadow-sm hover:bg-muted/40">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
