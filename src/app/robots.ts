import type { MetadataRoute } from "next";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.engleet.com";
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
