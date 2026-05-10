import { BookOpen, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type VocabularyLoadMoreProps = {
  loadedCount: number;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function VocabularyLoadMore({
  loadedCount,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
}: VocabularyLoadMoreProps) {
  if (loadedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 border-t pt-6">
      <p className="text-sm text-muted-foreground">
        แสดง {loadedCount} จาก {total} คำ
      </p>
      {hasMore && (
        <Button
          type="button"
          variant="outline"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="min-w-40"
        >
          {loadingMore ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          {loadingMore ? "กำลังโหลด..." : "ดูคำศัพท์เพิ่ม"}
        </Button>
      )}
    </div>
  );
}
