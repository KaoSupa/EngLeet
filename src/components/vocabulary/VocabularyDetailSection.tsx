import type { ReactNode } from "react";

type VocabularyDetailSectionProps = {
  title: string;
  children: ReactNode;
};

export function VocabularyDetailSection({
  title,
  children,
}: VocabularyDetailSectionProps) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </section>
  );
}
