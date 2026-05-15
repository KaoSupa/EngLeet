import type { ReactNode } from "react";

import {
  getLearningBadgeTone,
  LearningBadge,
} from "@/components/ui/learning-badge";

type VocabularyBadgeTone =
  | "neutral"
  | "category"
  | "part"
  | "difficulty"
  | "source";

export function VocabularyBadge({
  children,
  value,
  tone,
}: {
  children: ReactNode;
  value?: string | null;
  tone?: VocabularyBadgeTone;
}) {
  return (
    <LearningBadge tone={tone ?? getLearningBadgeTone(value)}>
      {children}
    </LearningBadge>
  );
}
