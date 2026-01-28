"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, AgeRange, CollectionCategory } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface GuideWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

const AGE_RANGES: { value: AgeRange | "all"; label: string }[] = [
  { value: "all", label: "All Ages" },
  { value: "0-2", label: "0-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "6-8", label: "6-8 years" },
  { value: "9-12", label: "9-12 years" },
  { value: "13-18", label: "13-18 years" },
];

const CATEGORIES: { value: CollectionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "toys", label: "Toys" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "gear", label: "Gear" },
  { value: "room-decor", label: "Room Decor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "arts-crafts", label: "Arts & Crafts" },
  { value: "electronics", label: "Electronics" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

export default function GuidesPage() {
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<GuideWithCreator[]>([]);
  const [ageFilter, setAgeFilter] = useState<AgeRange | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CollectionCategory | "all">("all");

  useEffect(() => {
    loadGuides();
  }, [ageFilter, categoryFilter]);

  async function loadGuides() {
    setLoading(true);

    let query = supabase
      .from("collections")
      .select(`*, creator_profiles ( id, username, display_name, avatar_url, guide_enabled )`)
      .eq("is_public", true)
      .order("view_count", { ascending: false })
      .limit(50);

    if (ageFilter !== "all") {
      query = query.eq("age_range", ageFilter);
    }

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data } = await query;

    // Filter to only show guides from Giddy Guide enabled profiles
    const filteredGuides = ((data || []) as GuideWithCreator[]).filter(
      (g) => g.creator_profiles?.guide_enabled
    );

    setGuides(filteredGuides);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-red-light to-white">
        <div className="mx-auto max-w-6xl px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center">
            Giddy Guides
          </h1>
          <p className="mt-4 text-lg text-foreground/60 text-center max-w-2xl mx-auto">
            Curated gift ideas from moms who get it. Find the perfect gift for any age, any occasion.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-foreground/60 mb-2">Age Range</label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as AgeRange | "all")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
            >
              {AGE_RANGES.map((age) => (
                <option key={age.value} value={age.value}>
                  {age.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-foreground/60 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CollectionCategory | "all")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
            <p className="mt-3 text-sm text-foreground/50">Loading guides...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="rounded-3xl bg-gray-50 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">No guides found</div>
            <p className="mt-2 text-foreground/50">
              Try adjusting your filters to see more guides
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={`/guide/${guide.creator_profiles?.username}/${guide.slug}`}
                className="group block"
              >
                {/* Cover Image */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  {guide.cover_image_url ? (
                    <Image
                      src={guide.cover_image_url}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-foreground/20 bg-gradient-to-br from-red-light to-gold-light">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Age badge */}
                  {guide.age_range && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                        Ages {guide.age_range}
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                      {guide.title}
                    </h3>
                  </div>
                </div>

                {/* Creator info */}
                <div className="mt-4 flex items-center gap-3">
                  <Avatar
                    src={guide.creator_profiles?.avatar_url}
                    name={guide.creator_profiles?.display_name || guide.creator_profiles?.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {guide.creator_profiles?.display_name || guide.creator_profiles?.username}
                    </div>
                  </div>
                  <div className="text-xs text-foreground/40">
                    {guide.view_count.toLocaleString()} views
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
