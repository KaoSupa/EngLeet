"use client";

import { useEffect } from "react";

import { trackLessonView } from "@/lib/analytics/events";

export default function LessonViewAnalytics({
  lessonId,
  slug,
  category,
  level,
}: {
  lessonId: string;
  slug: string;
  category: string;
  level: string | null;
}) {
  useEffect(() => {
    trackLessonView({ lessonId, slug, category, level });
  }, [category, lessonId, level, slug]);

  return null;
}
