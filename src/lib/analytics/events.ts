"use client";

import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null;
type AnalyticsProperties = Record<string, AnalyticsValue>;

function sendAnalyticsEvent(name: string, properties?: AnalyticsProperties) {
  try {
    track(name, properties);
  } catch {
    // Analytics should never block learning interactions.
  }
}

export function trackLessonView(properties: {
  lessonId: string;
  slug: string;
  category: string;
  level: string | null;
}) {
  sendAnalyticsEvent("lesson_view", {
    lesson_id: properties.lessonId,
    slug: properties.slug,
    category: properties.category,
    level: properties.level,
  });
}

export function trackQuizSubmit(properties: {
  lessonId: string;
  score: number;
  percentage: number;
  passed: boolean;
}) {
  sendAnalyticsEvent("quiz_submit", {
    lesson_id: properties.lessonId,
    score: properties.score,
    percentage: properties.percentage,
    passed: properties.passed,
  });
}

export function trackVocabularySave(properties: {
  vocabularyId: string;
  word: string;
  level: string | null;
  partOfSpeech: string | null;
}) {
  sendAnalyticsEvent("vocabulary_save", {
    vocabulary_id: properties.vocabularyId,
    word: properties.word,
    level: properties.level,
    part_of_speech: properties.partOfSpeech,
  });
}
