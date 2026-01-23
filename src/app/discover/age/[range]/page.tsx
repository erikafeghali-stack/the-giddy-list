"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, AgeRange, TrendingGift } from "@/lib/types";
import Avatar from "@/components/Avatar";
import AgeFilter from "@/components/AgeFilter";
import ProductImage from "@/components/ProductImage";

interface CollectionWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

const AGE_LABELS: Record<string, string> = {
  "0-2": "0-2 Years",
  "3-5": "3-5 Years",
  "6-8": "6-8 Years",
  "9-12": "9-12 Years",
  "13-18": "13-18 Years",
};

export default function DiscoverByAgePage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = use(params);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionWithCreator[]>([]);
  const [trendingGifts, setTrendingGifts] = useState<TrendingGift[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load collections
      const { data } = await supabase
        .from("collections")
        .select("*, creator_profiles(*)")
        .eq("is_public", true)
        .eq("age_range", range)
        .order("view_count", { ascending: false });

      // Load trending gifts for this age range
      try {
        const res = await fetch(`/api/trending-gifts?age_range=${range}&limit=12`);
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
  }, [range]);

  const ageLabel = AGE_LABELS[range] || range;

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/discover"
            className="inline-flex items-center text-sm text-foreground/60 hover:text-red transition-colors mb-2"
          >
            &larr; Back to Discover
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Gift Guides for Ages {ageLabel}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {collections.length} collections found
          </p>
        </div>

        {/* Age Filter */}
        <AgeFilter
          value={range as AgeRange}
          onChange={(value) => {
            if (value) {
              window.location.href = `/discover/age/${value}`;
            } else {
              window.location.href = "/discover";
            }
          }}
        />

        {loading ? (
          <div className="mt-8 text-sm text-foreground/50">Loading...</div>
        ) : (
          <>
            {/* Trending Gifts Section */}
            {trendingGifts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Trending Gifts for Ages {ageLabel}
                </h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {trendingGifts.map((gift) => (
                    <a
                      key={gift.id}
                      href={gift.affiliate_url || gift.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-red/30 transition-all"
                    >
                      <div className="relative aspect-square bg-white">
                        <ProductImage
                          src={gift.image_url}
                          alt={gift.title}
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                        {gift.trending_score && gift.trending_score >= 90 && (
                          <div className="absolute top-2 left-2 bg-red text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                            Hot
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-red transition-colors">
                          {gift.title}
                        </h3>
                        {gift.price && (
                          <div className="mt-2 text-lg font-bold text-red">
                            ${gift.price.toFixed(2)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-foreground/50 capitalize">
                            {gift.retailer || "Shop"}
                          </span>
                          <span className="text-red font-medium group-hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Collections Section */}
            <div className="mt-10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Curated Collections
              </h2>
              {collections.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
                  <div className="text-lg font-semibold text-foreground">
                    No collections for this age range yet
                  </div>
                  <p className="mt-2 text-sm text-foreground/60">
                    Be the first to create a gift guide for ages {ageLabel}!
                  </p>
                  <Link
                    href="/collections/new"
                    className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                  >
                    Create Collection
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[4/3] bg-cream-dark">
                        {collection.cover_image_url && (
                          <Image
                            src={collection.cover_image_url}
                            alt={collection.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
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
                          <span className="text-xs text-foreground/60 truncate">
                            {collection.creator_profiles?.display_name ||
                              collection.creator_profiles?.username}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
