import Link from "next/link";
import { Bookmark, BookmarkCheck, Loader2, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VocabularyItem } from "@/lib/learning/vocabulary";

import { VocabularyBadge } from "./VocabularyBadge";
import { VocabularyDetailSection } from "./VocabularyDetailSection";
import { VocabularyInfoRow } from "./VocabularyInfoRow";
import { formatPartOfSpeech, formatReviewStatus } from "./vocabulary-format";
import { VocabularyModalShell } from "./VocabularyModalShell";

type VocabularyDetailsModalProps = {
  item: VocabularyItem;
  isSaved: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function VocabularyDetailsModal({
  item,
  isSaved,
  isSaving,
  onClose,
  onSave,
}: VocabularyDetailsModalProps) {
  return (
    <VocabularyModalShell
      onClose={onClose}
      labelledBy="vocabulary-details-title"
    >
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">Vocabulary detail</p>
          <h2 id="vocabulary-details-title" className="text-2xl font-semibold">
            {item.word}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.phonetic && (
              <VocabularyBadge tone="source">{item.phonetic}</VocabularyBadge>
            )}
            {item.part_of_speech && (
              <VocabularyBadge tone="part">
                {formatPartOfSpeech(item.part_of_speech)}
              </VocabularyBadge>
            )}
            {item.cefr_level && (
              <VocabularyBadge value={item.cefr_level}>
                {item.cefr_level}
              </VocabularyBadge>
            )}
            {item.difficulty && (
              <VocabularyBadge tone="difficulty">
                Difficulty {item.difficulty}/5
              </VocabularyBadge>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
        <VocabularyDetailSection title="Definition">
          <p>{item.definition}</p>
          {item.definition_th && (
            <p className="mt-2 text-muted-foreground">{item.definition_th}</p>
          )}
        </VocabularyDetailSection>

        {(item.example_sentence || item.example_sentence_th) && (
          <VocabularyDetailSection title="Example">
            {item.example_sentence && <p>{item.example_sentence}</p>}
            {item.example_sentence_th && (
              <p className="mt-2 text-muted-foreground">
                {item.example_sentence_th}
              </p>
            )}
          </VocabularyDetailSection>
        )}

        <VocabularyDetailSection title="Learning info">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <VocabularyInfoRow
              label="CEFR"
              value={item.cefr_level ?? "Not set"}
            />
            <VocabularyInfoRow
              label="Part of speech"
              value={
                item.part_of_speech
                  ? formatPartOfSpeech(item.part_of_speech)
                  : "Not set"
              }
            />
            <VocabularyInfoRow
              label="Difficulty"
              value={item.difficulty ? `${item.difficulty}/5` : "Not set"}
            />
            <VocabularyInfoRow
              label="Frequency rank"
              value={item.frequency_rank?.toLocaleString() ?? "Not set"}
            />
            <VocabularyInfoRow
              label="TOEIC"
              value={item.is_toeic ? "Yes" : "No"}
            />
            <VocabularyInfoRow
              label="Oxford"
              value={item.is_oxford ? "Yes" : "No"}
            />
          </div>
        </VocabularyDetailSection>

        {item.tags.length > 0 && (
          <VocabularyDetailSection title="Tags">
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <VocabularyBadge key={tag}>{tag}</VocabularyBadge>
              ))}
            </div>
          </VocabularyDetailSection>
        )}

        <VocabularyDetailSection title="Source">
          <div className="space-y-2 text-sm">
            <VocabularyInfoRow label="Source" value={item.source} />
            <VocabularyInfoRow
              label="Review"
              value={formatReviewStatus(item.review_status)}
            />
            {item.license && (
              <VocabularyInfoRow label="License" value={item.license} />
            )}
            {item.source_url && (
              <Link
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-primary hover:underline"
              >
                View source
              </Link>
            )}
          </div>
        </VocabularyDetailSection>
      </div>

      <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {item.tts_audio_url ? (
          <Button type="button" variant="outline" asChild>
            <a href={item.tts_audio_url}>
              <Volume2 className="h-4 w-4" />
              Audio
            </a>
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground">No audio available</div>
        )}

        <Button type="button" onClick={onSave} disabled={isSaved || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {isSaved ? "Saved" : "Save vocabulary"}
        </Button>
      </div>
    </VocabularyModalShell>
  );
}
