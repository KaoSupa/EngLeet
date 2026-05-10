import { Sparkles } from "lucide-react";

export function EmptyVocabularyState({ savedOnly }: { savedOnly: boolean }) {
  return (
    <section className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed bg-card px-6 py-10 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          {savedOnly ? "ยังไม่มีคำศัพท์ที่บันทึกไว้" : "ไม่พบคำศัพท์"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {savedOnly
            ? "ลองบันทึกคำศัพท์จากรายการทั้งหมด แล้วกลับมาดูเฉพาะคำที่บันทึกไว้ได้ที่นี่"
            : "ลองเปลี่ยนคำค้นหาหรือลดตัวกรองลงเพื่อดูผลลัพธ์เพิ่มเติม"}
        </p>
      </div>
    </section>
  );
}
