import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ShortlistClient from "./ShortlistClient";

// Fetch shortlist data for metadata
async function getShortlist(slug: string) {
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
  const shortlist = await getShortlist(slug);

  if (!shortlist) {
    return {
      title: "Giddy Shortlist Not Found | The Giddy List",
      description: "This shortlist may be private or no longer exists.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids = shortlist.kids as any;
  const kidName = Array.isArray(kids) ? kids[0]?.name : kids?.name;
  const title = shortlist.name + (kidName ? ` for ${kidName}` : "") + " | The Giddy List";
  const description = shortlist.description ||
    `Check out this Giddy Shortlist${kidName ? ` for ${kidName}` : ""}${shortlist.occasion ? ` - ${shortlist.occasion}` : ""} on The Giddy List.`;

  return {
    title,
    description,
    openGraph: {
      title: shortlist.name,
      description,
      type: "website",
      siteName: "The Giddy List",
      images: shortlist.cover_image_url
        ? [
            {
              url: shortlist.cover_image_url,
              width: 1200,
              height: 630,
              alt: shortlist.name,
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
      title: shortlist.name,
      description,
      images: shortlist.cover_image_url
        ? [shortlist.cover_image_url]
        : ["https://thegiddylist.com/og-image.png"],
    },
  };
}

export default async function ShortlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ShortlistClient slug={slug} />;
}
