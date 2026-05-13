import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/config/site";
import { getPublishedLessons } from "@/lib/learning/lessons";
import { createServiceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/learn/lessons`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/learn/vocabulary`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dictionary`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  try {
    const supabase = createServiceClient();
    const { lessons } = await getPublishedLessons(supabase);
    return [
      ...staticRoutes,
      ...lessons.map((lesson) => ({
        url: `${baseUrl}/learn/lessons/${lesson.slug}`,
        lastModified: lesson.published_at
          ? new Date(lesson.published_at)
          : now,
        changeFrequency: "monthly" as const,
        priority: 0.65,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
