import { Bookmark, BookmarkCheck, Info, Loader2, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VocabularyItem } from "@/lib/learning/vocabulary";

import { VocabularyBadge } from "./VocabularyBadge";
import { formatPartOfSpeech } from "./vocabulary-format";

type VocabularyCardProps = {
  item: VocabularyItem;
  isSaved: boolean;
  isSaving: boolean;
  onOpenDetails: () => void;
  onSave: () => void;
};

export function VocabularyCard({
  item,
  isSaved,
  isSaving,
  onOpenDetails,
  onSave,
}: VocabularyCardProps) {
  return (
    <article className="flex min-h-[280px] flex-col rounded-lg border bg-card p-5 shadow-sm transition hover:border-foreground/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold">{item.word}</h2>
            {item.phonetic && (
              <span className="text-sm text-muted-foreground">
                {item.phonetic}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.part_of_speech && (
              <VocabularyBadge>
                {formatPartOfSpeech(item.part_of_speech)}
              </VocabularyBadge>
            )}
            {item.cefr_level && (
              <VocabularyBadge>{item.cefr_level}</VocabularyBadge>
            )}
            {item.is_toeic && <VocabularyBadge>TOEIC</VocabularyBadge>}
            {item.is_oxford && <VocabularyBadge>Oxford</VocabularyBadge>}
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaved || isSaving}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
            isSaved
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "hover:bg-muted",
          )}
          aria-label={isSaved ? "Vocabulary saved" : "Save vocabulary"}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {item.definition}
      </p>

      {item.definition_th && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
          {item.definition_th}
        </p>
      )}

      {item.example_sentence && (
        <p className="mt-4 line-clamp-2 border-l-2 pl-3 text-sm italic text-muted-foreground">
          {item.example_sentence}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Tags className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {item.tags.length > 0 ? item.tags.slice(0, 3).join(", ") : "No tag"}
          </span>
        </div>
        <Button type="button" variant="outline" onClick={onOpenDetails}>
          <Info className="h-4 w-4" />
          Details
        </Button>
      </div>
    </article>
  );
}
