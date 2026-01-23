"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, AgeRange } from "@/lib/types";
import Avatar from "@/components/Avatar";
import AgeFilter from "@/components/AgeFilter";

interface CollectionWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

// Clean SVG icons for categories
const CategoryIcon = ({ type, className = "w-6 h-6" }: { type: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    toys: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clothing: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7l3-3 4 4 3-3v6l-3 3V7M3 21h18M5 21V10l2-3M19 21V10l-2-3" />
      </svg>
    ),
    books: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gear: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    "room-decor": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    outdoor: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "arts-crafts": (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    electronics: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };
  return <>{icons[type] || icons.toys}</>;
};

const CATEGORIES = [
  { value: "toys", label: "Toys & Games" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "gear", label: "Gear & Essentials" },
  { value: "room-decor", label: "Room Decor" },
  { value: "outdoor", label: "Outdoor & Sports" },
  { value: "arts-crafts", label: "Arts & Crafts" },
  { value: "electronics", label: "Electronics" },
];

const AGE_LABELS: Record<AgeRange, string> = {
  "0-2": "Babies & Toddlers",
  "3-5": "Preschoolers",
  "6-8": "Early School",
  "9-12": "Tweens",
  "13-18": "Teens",
};

export default function DiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionWithCreator[]>([]);
  const [followingCollections, setFollowingCollections] = useState<CollectionWithCreator[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"discover" | "following">("discover");

  useEffect(() => {
    async function loadContent() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      setIsLoggedIn(!!userId);

      // Load featured collections
      let collectionsQuery = supabase
        .from("collections")
        .select("*, creator_profiles(*)")
        .eq("is_public", true)
        .order("view_count", { ascending: false })
        .limit(12);

      if (selectedAge) {
        collectionsQuery = collectionsQuery.eq("age_range", selectedAge);
      }

      if (selectedCategory) {
        collectionsQuery = collectionsQuery.eq("category", selectedCategory);
      }

      if (searchQuery.trim()) {
        collectionsQuery = collectionsQuery.ilike("title", `%${searchQuery.trim()}%`);
      }

      const { data: collectionsData } = await collectionsQuery;

      // Load featured creators
      const { data: creatorsData } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("is_public", true)
        .order("total_followers", { ascending: false })
        .limit(8);

      setCollections((collectionsData || []) as CollectionWithCreator[]);
      setCreators((creatorsData || []) as CreatorProfile[]);

      // Load following feed if logged in
      if (userId) {
        const { data: followingData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followingData && followingData.length > 0) {
          const followingIds = followingData.map((f) => f.following_id);

          const { data: followingCollectionsData } = await supabase
            .from("collections")
            .select("*, creator_profiles(*)")
            .eq("is_public", true)
            .in("user_id", followingIds)
            .order("created_at", { ascending: false })
            .limit(12);

          setFollowingCollections(
            (followingCollectionsData || []) as CollectionWithCreator[]
          );
        }
      }

      setLoading(false);
    }

    loadContent();
  }, [selectedAge, selectedCategory, searchQuery]);

  const clearFilters = () => {
    setSelectedAge(null);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const hasFilters = selectedAge || selectedCategory || searchQuery;

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Hero Section - Editorial, Grand */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-8 py-12 md:py-16">
          <p className="text-red font-medium text-sm uppercase tracking-wider mb-4">Gift Guides</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
            Discover
          </h1>
          <p className="mt-4 text-lg text-foreground/50 max-w-lg">
            Curated gift guides from parents, influencers, and tastemakers who get it
          </p>

          {/* Search - Premium styling */}
          <div className="relative mt-8 max-w-xl">
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gift guides..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-14 pr-6 py-4 text-base placeholder:text-foreground/40 focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
            />
          </div>

          {/* Tabs - More refined */}
          {isLoggedIn && (
            <div className="mt-8 flex items-center gap-2">
              <button
                onClick={() => setActiveTab("discover")}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === "discover"
                    ? "bg-foreground text-white shadow-lg"
                    : "text-foreground/60 hover:bg-gray-100"
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === "following"
                    ? "bg-foreground text-white shadow-lg"
                    : "text-foreground/60 hover:bg-gray-100"
                }`}
              >
                Following
                {followingCollections.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">
                    {followingCollections.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-12">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-12">
          <span className="text-sm text-foreground/40 mr-2">Filter by age:</span>
          <AgeFilter
            value={selectedAge}
            onChange={setSelectedAge}
            variant="pills"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-4 text-sm text-red font-medium hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-10 h-10 border-2 border-gray-200 border-t-red rounded-full animate-spin" />
            <p className="mt-4 text-foreground/40">Loading...</p>
          </div>
        ) : activeTab === "following" && followingCollections.length > 0 ? (
          /* Following Feed */
          <section>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
              Latest from People You Follow
            </h2>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {followingCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* Categories - Clean Grid */}
            {!hasFilters && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    Shop by Category
                  </h2>
                  <Link
                    href="/discover/categories"
                    className="text-sm text-red font-medium hover:underline flex items-center gap-1"
                  >
                    See all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(
                        selectedCategory === cat.value ? null : cat.value
                      )}
                      className={`group rounded-2xl p-5 text-center transition-all duration-200 ${
                        selectedCategory === cat.value
                          ? "bg-foreground text-white shadow-lg"
                          : "bg-gray-50 hover:bg-gray-100 hover:shadow-md"
                      }`}
                    >
                      <div className={`mb-3 flex justify-center transition-colors ${
                        selectedCategory === cat.value
                          ? "text-white"
                          : "text-foreground/40 group-hover:text-foreground/60"
                      }`}>
                        <CategoryIcon type={cat.value} className="w-8 h-8" />
                      </div>
                      <div className={`text-xs font-medium transition-colors ${
                        selectedCategory === cat.value
                          ? "text-white"
                          : "text-foreground/60 group-hover:text-foreground"
                      }`}>
                        {cat.label}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Creators - Premium Cards */}
            {creators.length > 0 && !hasFilters && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    Popular Creators
                  </h2>
                  <Link
                    href="/creators"
                    className="text-sm text-red font-medium hover:underline flex items-center gap-1"
                  >
                    See all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                  {creators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/${creator.username}`}
                      className="group text-center"
                    >
                      <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24">
                        <Avatar
                          src={creator.avatar_url}
                          name={creator.display_name || creator.username}
                          size="xl"
                          className="w-full h-full ring-4 ring-gray-100 group-hover:ring-red/20 transition-all duration-300 shadow-md"
                        />
                      </div>
                      <div className="mt-4 font-medium text-foreground truncate">
                        {creator.display_name || creator.username}
                      </div>
                      <div className="mt-1 text-xs text-foreground/40">
                        {creator.total_followers.toLocaleString()} followers
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Collections Grid - Editorial Magazine Layout */}
            <section>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-red font-medium text-sm uppercase tracking-wider mb-2">Editor's Picks</p>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : selectedAge
                      ? `Gift Guides for ${AGE_LABELS[selectedAge]}`
                      : selectedCategory
                      ? `${CATEGORIES.find(c => c.value === selectedCategory)?.label} Gift Guides`
                      : "Trending Gift Guides"}
                  </h2>
                </div>
                {collections.length > 0 && (
                  <span className="text-sm text-foreground/40">
                    {collections.length} collections
                  </span>
                )}
              </div>

              {collections.length === 0 ? (
                <div className="rounded-3xl bg-gray-50 p-16 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-10 h-10 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    {searchQuery ? "No collections found" : "No collections yet"}
                  </h3>
                  <p className="mt-3 text-foreground/50 max-w-sm mx-auto">
                    {searchQuery
                      ? "Try a different search term or clear filters"
                      : "Be the first to create a gift guide!"}
                  </p>
                  <Link
                    href="/collections/new"
                    className="mt-8 inline-block rounded-full bg-red px-8 py-4 font-medium text-white hover:bg-red-hover transition-all duration-200 shadow-lg shadow-red/25"
                  >
                    Create Collection
                  </Link>
                </div>
              ) : (
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function CollectionCard({ collection }: { collection: CollectionWithCreator }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group block"
    >
      {/* Image - Taller aspect ratio, editorial style */}
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100">
        {collection.cover_image_url ? (
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}

        {/* Age badge overlay */}
        {collection.age_range && (
          <div className="absolute top-5 left-5">
            <span className="rounded-full bg-white/95 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
              Ages {collection.age_range}
            </span>
          </div>
        )}

        {/* Gradient overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl md:text-2xl font-display font-bold text-white leading-tight">
            {collection.title}
          </h3>
        </div>
      </div>

      {/* Creator info - prominent, personal */}
      <div className="mt-5 flex items-center gap-4">
        <Avatar
          src={collection.creator_profiles?.avatar_url}
          name={collection.creator_profiles?.display_name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/40 uppercase tracking-wider">Curated by</p>
          <p className="font-medium text-foreground truncate">
            {collection.creator_profiles?.display_name ||
              collection.creator_profiles?.username}
          </p>
        </div>
        {collection.view_count > 0 && (
          <span className="text-xs text-foreground/40">
            {collection.view_count.toLocaleString()} views
          </span>
        )}
      </div>
    </Link>
  );
}
