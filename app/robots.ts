import type { MetadataRoute } from "next";

// Stories and account surfaces are private; only the public pages may be crawled.
// The private pages also carry robots noindex metadata — belt and suspenders for
// links that leak past robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/story/", "/stories", "/auth/", "/api/"],
    },
  };
}
