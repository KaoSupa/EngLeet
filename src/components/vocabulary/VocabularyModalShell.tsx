import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type VocabularyModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  labelledBy: string;
  compact?: boolean;
};

export function VocabularyModalShell({
  children,
  onClose,
  labelledBy,
  compact,
}: VocabularyModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "w-full overflow-hidden rounded-lg border bg-card shadow-2xl",
          compact ? "max-w-md" : "max-w-3xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
