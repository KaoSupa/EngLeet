"use client";

import { useEffect, useMemo, useState } from "react";

import { trackVocabularySave } from "@/lib/analytics/events";
import type {
  VocabularyFilters,
  VocabularyItem,
} from "@/lib/learning/vocabulary";

import { EmptyVocabularyState } from "./EmptyVocabularyState";
import { LoginRequiredModal } from "./LoginRequiredModal";
import { VocabularyAlert } from "./VocabularyAlert";
import { VocabularyCard } from "./VocabularyCard";
import { VocabularyDetailsModal } from "./VocabularyDetailsModal";
import { VocabularyLoadMore } from "./VocabularyLoadMore";
import { VocabularyToolbar } from "./VocabularyToolbar";

type VocabularyExplorerProps = {
  items: VocabularyItem[];
  filters: VocabularyFilters;
  availableTags: string[];
  savedVocabularyIds: string[];
  isAuthenticated: boolean;
  total: number;
  error: string | null;
};

type VocabularyPageResponse = {
  items?: VocabularyItem[];
  error?: string | null;
};

export default function VocabularyExplorer({
  items,
  filters,
  availableTags,
  savedVocabularyIds,
  isAuthenticated,
  total,
  error,
}: VocabularyExplorerProps) {
  const [selectedVocabulary, setSelectedVocabulary] =
    useState<VocabularyItem | null>(null);
  const [loadedItems, setLoadedItems] = useState(items);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [optimisticSavedIds, setOptimisticSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const savedIds = useMemo(
    () => new Set([...savedVocabularyIds, ...optimisticSavedIds]),
    [optimisticSavedIds, savedVocabularyIds],
  );
  const hasMore = loadedItems.length < total;

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
        setSaveError("บันทึกคำศัพท์ไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
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
      setSaveError("บันทึกคำศัพท์ไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
    } finally {
      setSavingId(null);
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
      params.set("offset", loadedItems.length.toString());

      const response = await fetch(`/api/learning/vocabulary?${params}`);

      if (!response.ok) {
        setLoadMoreError("โหลดคำศัพท์เพิ่มไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
        return;
      }

      const data = (await response.json()) as VocabularyPageResponse;

      if (data.error) {
        setLoadMoreError(data.error);
        return;
      }

      appendUniqueItems(data.items ?? []);
    } catch {
      setLoadMoreError("โหลดคำศัพท์เพิ่มไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
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

      {loadedItems.length > 0 ? (
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
      ) : (
        <EmptyVocabularyState savedOnly={filters.savedOnly} />
      )}

      <VocabularyLoadMore
        loadedCount={loadedItems.length}
        total={total}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
      />

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
