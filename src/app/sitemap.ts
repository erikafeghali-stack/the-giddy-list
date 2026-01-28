import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thegiddylist.com";
  const supabase = getServiceClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Published gift guides
  const { data: guides } = await supabase
    .from("gift_guides")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const guidePages: MetadataRoute.Sitemap = (guides || []).map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated_at || guide.published_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages
  const categories = [
    "toys",
    "books",
    "clothing",
    "gear",
    "room-decor",
    "outdoor",
    "arts-crafts",
    "electronics",
    "sports",
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/discover/category/${category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Age range pages
  const ageRanges = ["0-2", "3-5", "6-8", "9-12", "13-18"];

  const agePages: MetadataRoute.Sitemap = ageRanges.map((age) => ({
    url: `${baseUrl}/discover/age/${age}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Public collections (limit to top 100 by views)
  const { data: collections } = await supabase
    .from("collections")
    .select("slug, updated_at")
    .eq("is_public", true)
    .order("view_count", { ascending: false })
    .limit(100);

  const collectionPages: MetadataRoute.Sitemap = (collections || []).map(
    (collection) => ({
      url: `${baseUrl}/collections/${collection.slug}`,
      lastModified: new Date(collection.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  // Public registries (limit to top 100)
  const { data: registries } = await supabase
    .from("registries")
    .select("slug, updated_at")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  const registryPages: MetadataRoute.Sitemap = (registries || []).map(
    (registry) => ({
      url: `${baseUrl}/s/${registry.slug}`,
      lastModified: new Date(registry.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })
  );

  return [
    ...staticPages,
    ...guidePages,
    ...categoryPages,
    ...agePages,
    ...collectionPages,
    ...registryPages,
  ];
}
