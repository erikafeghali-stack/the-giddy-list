"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, AgeRange, TrendingGift } from "@/lib/types";
import Avatar from "@/components/Avatar";
import AgeFilter from "@/components/AgeFilter";
import ProductImage from "@/components/ProductImage";

interface CollectionWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

const AGE_INFO: Record<string, { label: string; description: string }> = {
  "0-2": { label: "Baby & Toddler", description: "First toys, teethers, nursery essentials, and developmental gifts for little ones." },
  "3-5": { label: "Preschool", description: "Creative play, learning toys, and imaginative gifts for curious preschoolers." },
  "6-8": { label: "Early Elementary", description: "Building sets, books, art supplies, and hands-on gifts for growing minds." },
  "9-12": { label: "Tweens", description: "STEM kits, tech, hobbies, and exciting gifts for kids finding their passions." },
  "13-18": { label: "Teens", description: "Fashion, electronics, experiences, and trending gifts for teenagers." },
};

// Map legacy nav slugs to age ranges so /discover/age/babies etc work
const AGE_SLUG_TO_RANGE: Record<string, string> = {
  babies: "0-2",
  toddlers: "3-5",
  kids: "6-8",
  tweens: "9-12",
  teens: "13-18",
};

export default function DiscoverByAgePage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionWithCreator[]>([]);
  const [trendingGifts, setTrendingGifts] = useState<TrendingGift[]>([]);

  const canonicalRange = AGE_SLUG_TO_RANGE[range] ?? range;

  // Redirect legacy slugs (babies, toddlers, etc.) to canonical ranges (0-2, 3-5, etc.)
  useEffect(() => {
    if (canonicalRange !== range) {
      router.replace(`/discover/age/${canonicalRange}`);
    }
  }, [range, canonicalRange, router]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load collections (use canonical range for API/DB)
      const { data } = await supabase
        .from("collections")
        .select("*, creator_profiles(*)")
        .eq("is_public", true)
        .eq("age_range", canonicalRange)
        .order("view_count", { ascending: false });

      // Load trending gifts for this age range
      try {
        const res = await fetch(`/api/trending-gifts?age_range=${canonicalRange}&limit=12`);
        const giftsData = await res.json();
        if (giftsData.success && giftsData.data) {
          setTrendingGifts(giftsData.data);
        }
      } catch (err) {
        console.error("Failed to fetch trending gifts:", err);
      }

      setCollections((data || []) as CollectionWithCreator[]);
      setLoading(false);
    }

    loadData();
  }, [canonicalRange]);

  const info = AGE_INFO[canonicalRange] || { label: canonicalRange, description: "" };

  if (canonicalRange !== range) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-foreground/50 hover:text-red transition-colors mb-4"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Gifts for Ages {range}
          </h1>
          <p className="mt-1 text-sm text-foreground/50">{info.label}</p>
          <p className="mt-3 text-foreground/60 max-w-xl">
            {info.description}
          </p>

          {/* Age filter pills */}
          <div className="mt-6">
            <AgeFilter
              value={range as AgeRange}
              showAll={false}
              onChange={(value) => {
                if (value) {
                  router.push(`/discover/age/${value}`);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          /* Loading skeleton */
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Trending Gifts Section */}
            {trendingGifts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-5">
                  Popular Gift Ideas
                </h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {trendingGifts.map((gift) => (
                    <a
                      key={gift.id}
                      href={gift.affiliate_url || gift.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-red/20 transition-all"
                    >
                      <div className="relative aspect-square bg-white">
                        <ProductImage
                          src={gift.image_url}
                          alt={gift.title}
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        />
                        {gift.trending_score && gift.trending_score >= 90 && (
                          <div className="absolute top-2 left-2 bg-red text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
                            Popular
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-50">
                        <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-red transition-colors">
                          {gift.title}
                        </h3>
                        {gift.price && (
                          <div className="mt-2 text-lg font-bold text-red">
                            ${gift.price.toFixed(2)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-foreground/40 capitalize">
                            {gift.retailer || "Shop"}
                          </span>
                          <span className="text-red font-medium group-hover:underline">
                            View &rarr;
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Collections Section */}
            {collections.length > 0 && (
              <div className={trendingGifts.length > 0 ? "mt-12" : ""}>
                <h2 className="text-xl font-bold text-foreground mb-5">
                  Curated Collections
                </h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[4/3] bg-gray-50">
                        {collection.cover_image_url && (
                          <ProductImage
                            src={collection.cover_image_url}
                            alt={collection.title}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {collection.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar
                            src={collection.creator_profiles?.avatar_url}
                            name={collection.creator_profiles?.display_name}
                            size="xs"
                          />
                          <span className="text-xs text-foreground/50 truncate">
                            {collection.creator_profiles?.display_name ||
                              collection.creator_profiles?.username}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state - only if no gifts AND no collections */}
            {trendingGifts.length === 0 && collections.length === 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-lg font-semibold text-foreground">
                  No gift ideas for this age range yet
                </div>
                <p className="mt-2 text-sm text-foreground/50">
                  Check back soon! We&apos;re adding new products all the time.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            )}

            {/* CTA for creating wishlists */}
            {trendingGifts.length > 0 && (
              <div className="mt-12 rounded-2xl bg-gradient-to-r from-red/5 to-gold/5 border border-red/10 p-8 text-center">
                <h3 className="text-lg font-bold text-foreground">
                  Found something they&apos;ll love?
                </h3>
                <p className="mt-2 text-sm text-foreground/50">
                  Create a free wishlist to save gifts and share with family.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                >
                  Start Your Wishlist
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
