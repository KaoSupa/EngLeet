"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid2X2, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  trackVocabularyReview,
  trackVocabularySave,
} from "@/lib/analytics/events";
import type {
  VocabularyFilters,
  VocabularyItem,
} from "@/lib/learning/vocabulary";

import { EmptyVocabularyState } from "./EmptyVocabularyState";
import { LoginRequiredModal } from "./LoginRequiredModal";
import { VocabularyAlert } from "./VocabularyAlert";
import { VocabularyCard } from "./VocabularyCard";
import { VocabularyDetailsModal } from "./VocabularyDetailsModal";
import { VocabularyFlashcards } from "./VocabularyFlashcards";
import { VocabularyLoadMore } from "./VocabularyLoadMore";
import { VocabularyToolbar } from "./VocabularyToolbar";

type VocabularyExplorerProps = {
  items: VocabularyItem[];
  filters: VocabularyFilters;
  availableTags: string[];
  savedVocabularyIds: string[];
  isAuthenticated: boolean;
  total: number;
  initialNextCursor: string | null;
  initialViewMode?: VocabularyViewMode;
  enableFlashcards?: boolean;
  error: string | null;
};

type VocabularyPageResponse = {
  items?: VocabularyItem[];
  error?: string | null;
  nextCursor?: string | null;
};

type VocabularyViewMode = "browse" | "flashcards";

const SAVE_ERROR_MESSAGE = "บันทึกคำศัพท์ไม่สำเร็จ โปรดลองใหม่อีกครั้ง";
const REVIEW_ERROR_MESSAGE = "บันทึกผลทบทวนไม่สำเร็จ โปรดลองใหม่อีกครั้ง";
const LOAD_MORE_ERROR_MESSAGE = "โหลดคำศัพท์เพิ่มไม่สำเร็จ โปรดลองใหม่อีกครั้ง";

export default function VocabularyExplorer({
  items,
  filters,
  availableTags,
  savedVocabularyIds,
  isAuthenticated,
  total,
  initialNextCursor,
  initialViewMode = "browse",
  enableFlashcards = false,
  error,
}: VocabularyExplorerProps) {
  const [selectedVocabulary, setSelectedVocabulary] =
    useState<VocabularyItem | null>(null);
  const [viewMode, setViewMode] = useState<VocabularyViewMode>(
    enableFlashcards ? initialViewMode : "browse",
  );
  const [loadedItems, setLoadedItems] = useState(items);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [optimisticSavedIds, setOptimisticSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor,
  );

  const savedIds = useMemo(
    () => new Set([...savedVocabularyIds, ...optimisticSavedIds]),
    [optimisticSavedIds, savedVocabularyIds],
  );
  const hasMore = loadedItems.length < total;

  useEffect(() => {
    setLoadedItems(items);
    setNextCursor(initialNextCursor);
  }, [initialNextCursor, items]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedVocabulary(null);
        setShowLoginModal(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSave(vocabulary: VocabularyItem) {
    setSaveError(null);

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (savedIds.has(vocabulary.id) || savingId) {
      return;
    }

    setSavingId(vocabulary.id);

    try {
      const response = await fetch(
        `/api/learning/vocabulary/${vocabulary.id}/save`,
        { method: "POST" },
      );

      if (response.status === 401) {
        setShowLoginModal(true);
        return;
      }

      if (!response.ok) {
        setSaveError(SAVE_ERROR_MESSAGE);
        return;
      }

      setOptimisticSavedIds((current) =>
        current.includes(vocabulary.id) ? current : [...current, vocabulary.id],
      );
      trackVocabularySave({
        vocabularyId: vocabulary.id,
        word: vocabulary.word,
        level: vocabulary.cefr_level,
        partOfSpeech: vocabulary.part_of_speech,
      });
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
    } finally {
      setSavingId(null);
    }
  }

  async function handleReview(vocabulary: VocabularyItem, quality: number) {
    setReviewError(null);

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }

    if (reviewingId) {
      return false;
    }

    setReviewingId(vocabulary.id);

    try {
      const response = await fetch(
        `/api/learning/vocabulary/${vocabulary.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quality }),
        },
      );

      if (response.status === 401) {
        setShowLoginModal(true);
        return false;
      }

      if (!response.ok) {
        setReviewError(await getLearningActionError(response));
        return false;
      }

      setOptimisticSavedIds((current) =>
        current.includes(vocabulary.id) ? current : [...current, vocabulary.id],
      );
      trackVocabularyReview({
        vocabularyId: vocabulary.id,
        word: vocabulary.word,
        quality,
      });
      return true;
    } catch {
      setReviewError(REVIEW_ERROR_MESSAGE);
      return false;
    } finally {
      setReviewingId(null);
    }
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      if (nextCursor) {
        params.set("cursor", nextCursor);
        params.delete("offset");
      } else {
        params.set("offset", loadedItems.length.toString());
      }

      const response = await fetch(`/api/learning/vocabulary?${params}`);

      if (!response.ok) {
        setLoadMoreError(LOAD_MORE_ERROR_MESSAGE);
        return;
      }

      const data = (await response.json()) as VocabularyPageResponse;

      if (data.error) {
        setLoadMoreError(data.error);
        return;
      }

      appendUniqueItems(data.items ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      setLoadMoreError(LOAD_MORE_ERROR_MESSAGE);
    } finally {
      setLoadingMore(false);
    }
  }

  function appendUniqueItems(incomingItems: VocabularyItem[]) {
    setLoadedItems((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...incomingItems.filter((item) => !seen.has(item.id)),
      ];
    });
  }

  function updateViewMode(nextMode: VocabularyViewMode) {
    setViewMode(nextMode);

    const url = new URL(window.location.href);
    if (nextMode === "flashcards") {
      url.searchParams.set("view", "flashcards");
    } else {
      url.searchParams.delete("view");
    }

    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div className="space-y-8">
      <VocabularyToolbar
        key={JSON.stringify(filters)}
        filters={filters}
        availableTags={availableTags}
        isAuthenticated={isAuthenticated}
        total={total}
      />

      {error && <VocabularyAlert>{error}</VocabularyAlert>}

      {saveError && (
        <VocabularyAlert
          onDismiss={() => setSaveError(null)}
          dismissLabel="Dismiss save error"
        >
          {saveError}
        </VocabularyAlert>
      )}

      {loadMoreError && (
        <VocabularyAlert
          onDismiss={() => setLoadMoreError(null)}
          dismissLabel="Dismiss load more error"
        >
          {loadMoreError}
        </VocabularyAlert>
      )}

      {reviewError && (
        <VocabularyAlert
          onDismiss={() => setReviewError(null)}
          dismissLabel="Dismiss review error"
        >
          {reviewError}
        </VocabularyAlert>
      )}

      {enableFlashcards && loadedItems.length > 0 && (
        <div
          role="group"
          aria-label="Vocabulary view"
          className="surface-panel inline-grid p-1 sm:grid-cols-2"
        >
          <Button
            type="button"
            variant={viewMode === "browse" ? "secondary" : "ghost"}
            aria-pressed={viewMode === "browse"}
            onClick={() => updateViewMode("browse")}
            className="justify-start"
          >
            <Grid2X2 className="h-4 w-4" />
            Browse
          </Button>
          <Button
            type="button"
            variant={viewMode === "flashcards" ? "secondary" : "ghost"}
            aria-pressed={viewMode === "flashcards"}
            onClick={() => updateViewMode("flashcards")}
            className="justify-start"
          >
            <Layers3 className="h-4 w-4" />
            Flashcards
          </Button>
        </div>
      )}

      {loadedItems.length > 0 ? (
        enableFlashcards && viewMode === "flashcards" ? (
          <VocabularyFlashcards
            items={loadedItems}
            total={total}
            savedIds={savedIds}
            savingId={savingId}
            reviewingId={reviewingId}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onOpenDetails={setSelectedVocabulary}
            onSave={handleSave}
            onReview={handleReview}
          />
        ) : (
          <>
            <section
              aria-label="Vocabulary results"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {loadedItems.map((item) => (
                <VocabularyCard
                  key={item.id}
                  item={item}
                  isSaved={savedIds.has(item.id)}
                  isSaving={savingId === item.id}
                  onOpenDetails={() => setSelectedVocabulary(item)}
                  onSave={() => handleSave(item)}
                />
              ))}
            </section>

            <VocabularyLoadMore
              loadedCount={loadedItems.length}
              total={total}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={handleLoadMore}
            />
          </>
        )
      ) : (
        <EmptyVocabularyState savedOnly={filters.savedOnly} />
      )}

      {selectedVocabulary && (
        <VocabularyDetailsModal
          item={selectedVocabulary}
          isSaved={savedIds.has(selectedVocabulary.id)}
          isSaving={savingId === selectedVocabulary.id}
          onClose={() => setSelectedVocabulary(null)}
          onSave={() => handleSave(selectedVocabulary)}
        />
      )}

      {showLoginModal && (
        <LoginRequiredModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}

async function getLearningActionError(response: Response) {
  try {
    const data = (await response.json()) as { error?: unknown };
    return typeof data.error === "string"
      ? data.error
      : REVIEW_ERROR_MESSAGE;
  } catch {
    return REVIEW_ERROR_MESSAGE;
  }
}
