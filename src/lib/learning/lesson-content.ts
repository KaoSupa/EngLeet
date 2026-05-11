import type { Json } from "@/types/supabase";

export type LessonContentBlock =
  | {
      id: string;
      type: "text";
      text: string;
    }
  | {
      id: string;
      type: "callout";
      title: string;
      text: string;
    }
  | {
      id: string;
      type: "image";
      url: string;
      alt: string;
      caption: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      caption: string;
    };

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(
  value: Json | undefined,
  fallback = "",
  maxLength = 5000,
) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

export function parseLessonContentBlock({
  id,
  blockType,
  content,
}: {
  id: string;
  blockType: string;
  content: Json;
}): LessonContentBlock | null {
  if (!isRecord(content)) {
    return null;
  }

  if (blockType === "text") {
    const text = stringValue(content.text, "", 12000);
    return text ? { id, type: "text", text } : null;
  }

  if (blockType === "callout") {
    const text = stringValue(content.text, "", 5000);
    return text
      ? {
          id,
          type: "callout",
          title: stringValue(content.title, "Remember", 80),
          text,
        }
      : null;
  }

  if (blockType === "image") {
    const url = stringValue(content.url, "", 2048);
    return url
      ? {
          id,
          type: "image",
          url,
          alt: stringValue(content.alt, "", 160),
          caption: stringValue(content.caption, "", 240),
        }
      : null;
  }

  if (blockType === "video") {
    const url = stringValue(content.url, "", 2048);
    return url
      ? {
          id,
          type: "video",
          url,
          caption: stringValue(content.caption, "", 240),
        }
      : null;
  }

  return null;
}

export function textToParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
