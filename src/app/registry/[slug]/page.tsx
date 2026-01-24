import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import RegistryClient from "./RegistryClient";

// Fetch registry data for metadata
async function getRegistry(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: registry } = await supabase
    .from("registries")
    .select(`
      id,
      name,
      slug,
      description,
      occasion,
      cover_image_url,
      kids ( name )
    `)
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  return registry;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const registry = await getRegistry(slug);

  if (!registry) {
    return {
      title: "Registry Not Found | The Giddy List",
      description: "This registry may be private or no longer exists.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids = registry.kids as any;
  const kidName = Array.isArray(kids) ? kids[0]?.name : kids?.name;
  const title = registry.name + (kidName ? ` for ${kidName}` : "") + " | The Giddy List";
  const description = registry.description ||
    `Check out this gift registry${kidName ? ` for ${kidName}` : ""}${registry.occasion ? ` - ${registry.occasion}` : ""} on The Giddy List.`;

  return {
    title,
    description,
    openGraph: {
      title: registry.name,
      description,
      type: "website",
      siteName: "The Giddy List",
      images: registry.cover_image_url
        ? [
            {
              url: registry.cover_image_url,
              width: 1200,
              height: 630,
              alt: registry.name,
            },
          ]
        : [
            {
              url: "https://thegiddylist.com/og-image.png",
              width: 1200,
              height: 630,
              alt: "The Giddy List",
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: registry.name,
      description,
      images: registry.cover_image_url
        ? [registry.cover_image_url]
        : ["https://thegiddylist.com/og-image.png"],
    },
  };
}

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RegistryClient slug={slug} />;
}
