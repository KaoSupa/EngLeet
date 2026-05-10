import type { ReactNode } from "react";

export function VocabularyBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}
