"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Brain,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Loader2,
  RotateCcw,
  Shuffle,
  Sparkles,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { VocabularyItem } from "@/lib/learning/vocabulary";

import { VocabularyBadge } from "./VocabularyBadge";
import { formatPartOfSpeech } from "./vocabulary-format";

type FlashcardQuality = 2 | 3 | 5;

type VocabularyFlashcardsProps = {
  items: VocabularyItem[];
  total: number;
  savedIds: Set<string>;
  savingId: string | null;
  reviewingId: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpenDetails: (item: VocabularyItem) => void;
  onSave: (item: VocabularyItem) => void;
  onReview: (item: VocabularyItem, quality: FlashcardQuality) => Promise<boolean>;
};

type SessionReviewMap = Record<string, FlashcardQuality>;

function getSessionCounts(reviews: SessionReviewMap) {
  return Object.values(reviews).reduce(
    (counts, quality) => {
      if (quality >= 5) {
        counts.known += 1;
      } else {
        counts.learning += 1;
      }

      return counts;
    },
    { known: 0, learning: 0 },
  );
}

function getQualityLabel(quality: FlashcardQuality) {
  if (quality >= 5) return "Known";
  if (quality >= 3) return "Hard";
  return "Again";
}

export function VocabularyFlashcards({
  items,
  total,
  savedIds,
  savingId,
  reviewingId,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenDetails,
  onSave,
  onReview,
}: VocabularyFlashcardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviews, setSessionReviews] = useState<SessionReviewMap>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const safeActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const currentItem = items[safeActiveIndex] ?? null;
  const currentReview = currentItem ? sessionReviews[currentItem.id] : null;
  const sessionCounts = useMemo(
    () => getSessionCounts(sessionReviews),
    [sessionReviews],
  );
  const progressValue = items.length
    ? Math.round(((safeActiveIndex + 1) / items.length) * 100)
    : 0;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function goToCard(nextIndex: number) {
    if (items.length === 0) {
      return;
    }

    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
    setIsFlipped(false);
  }

  function handleRandomCard() {
    if (items.length < 2) {
      return;
    }

    const nextIndex = Math.floor(Math.random() * items.length);
    goToCard(
      nextIndex === safeActiveIndex ? (nextIndex + 1) % items.length : nextIndex,
    );
  }

  function speakCurrentWord() {
    if (!currentItem) {
      return;
    }

    audioRef.current?.pause();

    if (currentItem.tts_audio_url) {
      const audio = new Audio(currentItem.tts_audio_url);
      audioRef.current = audio;
      void audio.play().catch(() => speakWithBrowserVoice(currentItem.word));
      return;
    }

    speakWithBrowserVoice(currentItem.word);
  }

  function speakWithBrowserVoice(word: string) {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  async function handleReview(quality: FlashcardQuality) {
    if (!currentItem || reviewingId) {
      return;
    }

    const reviewed = await onReview(currentItem, quality);
    if (!reviewed) {
      return;
    }

    setSessionReviews((current) => ({
      ...current,
      [currentItem.id]: quality,
    }));

    if (safeActiveIndex < items.length - 1) {
      goToCard(safeActiveIndex + 1);
    }
  }

  if (!currentItem) {
    return null;
  }

  const isSaved = savedIds.has(currentItem.id);
  const isSaving = savingId === currentItem.id;
  const isReviewing = reviewingId === currentItem.id;

  return (
    <section
      aria-label="Flashcard practice"
      className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Brain className="h-4 w-4" />
            Flashcards
          </div>
          <div className="flex flex-wrap gap-2">
            <VocabularyBadge tone="source">
              {safeActiveIndex + 1}/{items.length} loaded
            </VocabularyBadge>
            <VocabularyBadge tone="neutral">{total} matching</VocabularyBadge>
            {currentReview && (
              <VocabularyBadge
                tone={currentReview >= 5 ? "difficulty" : "category"}
              >
                {getQualityLabel(currentReview)}
              </VocabularyBadge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
          <span className="rounded-lg bg-muted px-3 py-2">
            {sessionCounts.known} known
          </span>
          <span className="rounded-lg bg-muted px-3 py-2">
            {sessionCounts.learning} learning
          </span>
        </div>
      </div>

      <Progress value={progressValue} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <button
          type="button"
          aria-pressed={isFlipped}
          aria-label={`Flip flashcard for ${currentItem.word}`}
          onClick={() => setIsFlipped((current) => !current)}
          className="flex min-h-[360px] flex-col rounded-lg border bg-background p-5 text-left shadow-sm transition hover:border-foreground/20 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <div className="flex flex-wrap items-center gap-2">
            {currentItem.part_of_speech && (
              <VocabularyBadge tone="part">
                {formatPartOfSpeech(currentItem.part_of_speech)}
              </VocabularyBadge>
            )}
            {currentItem.cefr_level && (
              <VocabularyBadge value={currentItem.cefr_level}>
                {currentItem.cefr_level}
              </VocabularyBadge>
            )}
            {currentItem.difficulty && (
              <VocabularyBadge tone="difficulty">
                Difficulty {currentItem.difficulty}/5
              </VocabularyBadge>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center gap-4 py-8">
            {!isFlipped ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  Word
                </p>
                <h2 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">
                  {currentItem.word}
                </h2>
                {currentItem.phonetic && (
                  <p className="text-lg text-muted-foreground">
                    {currentItem.phonetic}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  Definition
                </p>
                <p className="text-xl leading-8">{currentItem.definition}</p>
                {currentItem.definition_th && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-base">
                    {currentItem.definition_th}
                  </p>
                )}
                {currentItem.example_sentence && (
                  <p className="border-l-2 pl-3 text-sm italic leading-6 text-muted-foreground">
                    {currentItem.example_sentence}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            {isFlipped ? "Back" : "Flip"}
          </div>
        </button>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToCard(safeActiveIndex - 1)}
              disabled={safeActiveIndex === 0}
              aria-label="Previous flashcard"
            >
              <ChevronsLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRandomCard}
              disabled={items.length < 2}
              aria-label="Random flashcard"
            >
              <Shuffle className="h-4 w-4" />
              Random
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => goToCard(safeActiveIndex + 1)}
              disabled={safeActiveIndex >= items.length - 1}
              aria-label="Next flashcard"
            >
              <ChevronsRight className="h-4 w-4" />
              Next
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={speakCurrentWord}
            className="w-full"
          >
            <Volume2 className="h-4 w-4" />
            Audio
          </Button>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleReview(2)}
              disabled={Boolean(reviewingId)}
            >
              {isReviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Again
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleReview(3)}
              disabled={Boolean(reviewingId)}
            >
              {isReviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Hard
            </Button>
            <Button
              type="button"
              onClick={() => void handleReview(5)}
              disabled={Boolean(reviewingId)}
            >
              {isReviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Know it
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenDetails(currentItem)}
            >
              <Info className="h-4 w-4" />
              Details
            </Button>
            <Button
              type="button"
              variant={isSaved ? "secondary" : "outline"}
              onClick={() => onSave(currentItem)}
              disabled={isSaved || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>

          {hasMore && (
            <Button
              type="button"
              variant="outline"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="w-full"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {loadingMore ? "Loading..." : "Load more cards"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
