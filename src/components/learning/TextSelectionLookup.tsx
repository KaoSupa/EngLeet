"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { VocabularyBadge } from "@/components/vocabulary/VocabularyBadge";
import type {
  TextLookupItem,
  TextLookupResult,
} from "@/lib/learning/text-lookup";

import { formatPartOfSpeech } from "../vocabulary/vocabulary-format";

type LookupStatus = "loading" | "ready" | "error";

type LookupPopupState = {
  text: string;
  left: number;
  top: number;
  width: number;
  placement: "above" | "below";
  status: LookupStatus;
  data: TextLookupResult | null;
  error: string | null;
};

type SelectionSnapshot = {
  text: string;
  left: number;
  top: number;
  width: number;
  placement: LookupPopupState["placement"];
};

const LOOKUP_DELAY_MS = 180;
const POPUP_MAX_WIDTH = 360;
const POPUP_MARGIN = 12;

export default function TextSelectionLookup() {
  const [popup, setPopup] = useState<LookupPopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearPendingLookup = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const closePopup = useCallback(() => {
    clearPendingLookup();
    setPopup(null);
  }, [clearPendingLookup]);

  const requestLookup = useCallback(
    (snapshot: SelectionSnapshot) => {
      clearPendingLookup();
      setPopup({
        ...snapshot,
        status: "loading",
        data: null,
        error: null,
      });

      timeoutRef.current = window.setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const response = await fetch(
            `/api/learning/text-lookup?q=${encodeURIComponent(snapshot.text)}`,
            {
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            throw new Error("Lookup failed");
          }

          const data = (await response.json()) as TextLookupResult;
          setPopup((current) =>
            current?.text === snapshot.text
              ? {
                  ...current,
                  status: "ready",
                  data,
                  error: null,
                }
              : current,
          );
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setPopup((current) =>
            current?.text === snapshot.text
              ? {
                  ...current,
                  status: "error",
                  data: null,
                  error: "Lookup is unavailable right now.",
                }
              : current,
          );
        }
      }, LOOKUP_DELAY_MS);
    },
    [clearPendingLookup],
  );

  useEffect(() => {
    function openLookupFromSelection(event?: Event) {
      if (isPopupEventTarget(event?.target, popupRef.current)) {
        return;
      }

      const snapshot = getSelectionSnapshot();
      if (!snapshot) {
        return;
      }

      requestLookup(snapshot);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!isPopupEventTarget(event.target, popupRef.current)) {
        closePopup();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePopup();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (
        event.key.startsWith("Arrow") ||
        event.key === "Shift" ||
        event.key === "Meta" ||
        event.key === "Control"
      ) {
        openLookupFromSelection(event);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", openLookupFromSelection);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", openLookupFromSelection);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
      clearPendingLookup();
    };
  }, [clearPendingLookup, closePopup, requestLookup]);

  if (!popup) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      data-text-lookup-popup
      role="dialog"
      aria-label="Selected text lookup"
      className="fixed z-[70] rounded-lg border bg-popover text-popover-foreground shadow-2xl"
      style={{
        left: popup.left,
        top: popup.top,
        width: popup.width,
        transform: popup.placement === "above" ? "translateY(-100%)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            Selection lookup
          </div>
          <p className="mt-1 truncate font-semibold">{popup.text}</p>
        </div>
        <button
          type="button"
          onClick={closePopup}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close selected text lookup"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3 px-4 py-3 text-sm">
        {popup.status === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            กำลังค้นคำแปล...
          </div>
        )}

        {popup.status === "error" && (
          <p className="text-destructive">{popup.error}</p>
        )}

        {popup.status === "ready" && popup.data && (
          <LookupResultContent data={popup.data} onNavigate={closePopup} />
        )}
      </div>
    </div>
  );
}

function LookupResultContent({
  data,
  onNavigate,
}: {
  data: TextLookupResult;
  onNavigate: () => void;
}) {
  if (data.matches.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          ยังไม่พบคำนี้ในคลังคำศัพท์ของ Engleet
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link
            href={`/learn/vocabulary?q=${encodeURIComponent(data.query)}`}
            onClick={onNavigate}
          >
            <Search className="size-4" />
            ค้นใน Vocabulary
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.translation && (
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">คำแปล</p>
          <p className="mt-1 leading-6">{data.translation}</p>
        </div>
      )}

      {data.exactMatch ? (
        <ExactMatch item={data.exactMatch} onNavigate={onNavigate} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            คำสำคัญที่พบในประโยค
          </p>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {data.matches.map((item) => (
              <LookupMatchLink
                key={item.id}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExactMatch({
  item,
  onNavigate,
}: {
  item: TextLookupItem;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
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
        {item.is_toeic && <VocabularyBadge value="toeic">TOEIC</VocabularyBadge>}
        {item.is_oxford && (
          <VocabularyBadge value="oxford">Oxford</VocabularyBadge>
        )}
      </div>

      <p className="leading-6 text-muted-foreground">{item.definition}</p>
      {item.example_sentence && (
        <p className="border-l-2 pl-3 text-xs italic leading-5 text-muted-foreground">
          {item.example_sentence}
        </p>
      )}

      <Button asChild className="w-full">
        <Link
          href={`/learn/vocabulary?q=${encodeURIComponent(item.word)}`}
          onClick={onNavigate}
        >
          <BookOpen className="size-4" />
          ดูคำนี้ใน Vocabulary
          <ExternalLink className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function LookupMatchLink({
  item,
  onNavigate,
}: {
  item: TextLookupItem;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/learn/vocabulary?q=${encodeURIComponent(item.word)}`}
      onClick={onNavigate}
      className="block rounded-lg border px-3 py-2 transition hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{item.word}</span>
        {item.cefr_level && (
          <VocabularyBadge value={item.cefr_level}>
            {item.cefr_level}
          </VocabularyBadge>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {item.definition_th ?? item.definition}
      </p>
    </Link>
  );
}

function getSelectionSnapshot(): SelectionSnapshot | null {
  const selection = window.getSelection();
  const selectedText = selection?.toString().replace(/\s+/g, " ").trim() ?? "";

  if (
    !selection ||
    selection.rangeCount === 0 ||
    selectedText.length < 2 ||
    selectedText.length > 240 ||
    !/[a-zA-Z]/.test(selectedText)
  ) {
    return null;
  }

  const anchorNode = selection.anchorNode;
  if (anchorNode && isIgnoredSelectionNode(anchorNode)) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = getRangeRect(range);
  if (!rect) {
    return null;
  }

  return {
    text: selectedText,
    ...getPopupPosition(rect),
  };
}

function getRangeRect(range: Range) {
  const rects = Array.from(range.getClientRects());
  const rect =
    rects.find((item) => item.width > 0 && item.height > 0) ??
    range.getBoundingClientRect();

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
}

function getPopupPosition(rect: DOMRect): Omit<SelectionSnapshot, "text"> {
  const viewportWidth = window.innerWidth;
  const popupWidth = Math.min(POPUP_MAX_WIDTH, viewportWidth - POPUP_MARGIN * 2);
  const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
  const left = clamp(
    centeredLeft,
    POPUP_MARGIN,
    viewportWidth - popupWidth - POPUP_MARGIN,
  );
  const placement = rect.top < 260 ? "below" : "above";

  return {
    left,
    width: popupWidth,
    placement,
    top:
      placement === "below"
        ? rect.bottom + POPUP_MARGIN
        : rect.top - POPUP_MARGIN,
  };
}

function isPopupEventTarget(
  target: EventTarget | null | undefined,
  popupElement: HTMLElement | null,
) {
  return target instanceof Node && Boolean(popupElement?.contains(target));
}

function isIgnoredSelectionNode(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;

  return Boolean(
    element?.closest(
      "input, textarea, select, button, a, [contenteditable='true'], [data-text-lookup-popup]",
    ),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
