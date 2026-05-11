import { textToParagraphs, type LessonContentBlock } from "@/lib/learning/lesson-content";

export default function LessonContentBlocks({
  blocks,
}: {
  blocks: LessonContentBlock[];
}) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        เนื้อหาบทเรียนยังไม่พร้อม
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "text") {
          return (
            <section
              key={block.id}
              className="space-y-4 text-base leading-8 text-foreground"
            >
              {textToParagraphs(block.text).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          );
        }

        if (block.type === "callout") {
          return (
            <aside
              key={block.id}
              className="rounded-lg border border-primary/20 bg-primary/5 p-5"
            >
              <h2 className="text-sm font-semibold text-primary">
                {block.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-foreground">
                {block.text}
              </p>
            </aside>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.url}
                alt={block.alt}
                className="w-full rounded-lg border object-cover"
              />
              {block.caption && (
                <figcaption className="text-sm text-muted-foreground">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        return (
          <figure key={block.id} className="space-y-2">
            <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
              <iframe
                src={block.url}
                title={block.caption || "Lesson video"}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {block.caption && (
              <figcaption className="text-sm text-muted-foreground">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
