import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import GuideClient from "./GuideClient";
import JsonLdSchema from "@/components/JsonLdSchema";
import { GiftGuide, Product } from "@/lib/types";

// Create a service client for server-side data fetching
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Fetch guide data server-side
async function getGuideData(slug: string): Promise<{
  guide: GiftGuide | null;
  products: Array<Product & { ai_description: string | null; highlight_reason: string | null; display_order: number }>;
  relatedGuides: GiftGuide[];
}> {
  const supabase = getServiceClient();

  // Fetch the guide
  const { data: guide, error } = await supabase
    .from("gift_guides")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !guide) {
    return { guide: null, products: [], relatedGuides: [] };
  }

  // Fetch products for this guide
  const { data: guideProducts } = await supabase
    .from("gift_guide_products")
    .select(`
      display_order,
      ai_description,
      highlight_reason,
      products (*)
    `)
    .eq("guide_id", guide.id)
    .order("display_order");

  const products = (guideProducts || []).map((gp) => ({
    ...(gp.products as unknown as Product),
    ai_description: gp.ai_description,
    highlight_reason: gp.highlight_reason,
    display_order: gp.display_order,
  }));

  // Fetch related guides (same category or age range)
  let relatedQuery = supabase
    .from("gift_guides")
    .select("*")
    .eq("status", "published")
    .neq("slug", slug)
    .limit(5);

  if (guide.category) {
    relatedQuery = relatedQuery.eq("category", guide.category);
  } else if (guide.age_range) {
    relatedQuery = relatedQuery.eq("age_range", guide.age_range);
  }

  const { data: relatedGuides } = await relatedQuery.order("view_count", { ascending: false });

  // Increment view count asynchronously
  supabase.rpc("increment_guide_view_count", { guide_slug: slug }).catch(() => {});

  return {
    guide: guide as GiftGuide,
    products,
    relatedGuides: (relatedGuides || []) as GiftGuide[],
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { guide } = await getGuideData(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | The Giddy List",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thegiddylist.com";
  const url = `${baseUrl}/guides/${guide.slug}`;

  return {
    title: `${guide.title} | The Giddy List`,
    description: guide.meta_description || guide.intro_content?.slice(0, 160),
    keywords: guide.keywords?.join(", "),
    openGraph: {
      title: guide.title,
      description: guide.meta_description || guide.intro_content?.slice(0, 160) || "",
      url,
      siteName: "The Giddy List",
      type: "article",
      publishedTime: guide.published_at || undefined,
      modifiedTime: guide.updated_at,
      ...(guide.cover_image_url && {
        images: [
          {
            url: guide.cover_image_url,
            width: 1200,
            height: 630,
            alt: guide.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.meta_description || guide.intro_content?.slice(0, 160) || "",
      ...(guide.cover_image_url && {
        images: [guide.cover_image_url],
      }),
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// Generate static params for popular guides
export async function generateStaticParams() {
  const supabase = getServiceClient();

  const { data: guides } = await supabase
    .from("gift_guides")
    .select("slug")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(50);

  return (guides || []).map((guide) => ({
    slug: guide.slug,
  }));
}

// Main page component
export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { guide, products, relatedGuides } = await getGuideData(slug);

  if (!guide) {
    notFound();
  }

  return (
    <>
      <JsonLdSchema guide={guide} products={products} />
      <GuideClient guide={guide} products={products} relatedGuides={relatedGuides} />
    </>
  );
}
