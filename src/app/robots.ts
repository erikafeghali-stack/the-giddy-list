import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thegiddylist.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/guides/",
          "/discover/",
          "/collections/",
          "/s/",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/extension/",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: [
          "/",
          "/guides/",
          "/discover/",
        ],
        disallow: [
          "/api/",
          "/admin/",
        ],
      },
      {
        userAgent: "CCBot",
        allow: [
          "/",
          "/guides/",
          "/discover/",
        ],
        disallow: [
          "/api/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
