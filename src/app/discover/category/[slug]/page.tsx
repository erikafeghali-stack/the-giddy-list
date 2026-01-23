"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, CollectionCategory } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface CollectionWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

const CATEGORY_LABELS: Record<string, string> = {
  toys: "Toys & Games",
  clothing: "Clothing",
  books: "Books",
  gear: "Gear & Equipment",
  "room-decor": "Room Decor",
  outdoor: "Outdoor & Sports",
  "arts-crafts": "Arts & Crafts",
  electronics: "Electronics",
  sports: "Sports",
  other: "Other",
};

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function DiscoverByCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionWithCreator[]>([]);

  useEffect(() => {
    async function loadCollections() {
      setLoading(true);

      const { data } = await supabase
        .from("collections")
        .select("*, creator_profiles(*)")
        .eq("is_public", true)
        .eq("category", slug)
        .order("view_count", { ascending: false });

      setCollections((data || []) as CollectionWithCreator[]);
      setLoading(false);
    }

    loadCollections();
  }, [slug]);

  const categoryLabel = CATEGORY_LABELS[slug] || slug;

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
          <h1 className="text-2xl font-bold text-foreground">{categoryLabel}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {collections.length} collections found
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          <Link
            href="/discover"
            className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium bg-card border border-border text-foreground/70 hover:bg-cream-dark transition-colors"
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/discover/category/${cat.value}`}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                slug === cat.value
                  ? "bg-red text-white"
                  : "bg-card border border-border text-foreground/70 hover:bg-cream-dark"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-foreground/50">Loading...</div>
        ) : collections.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">
              No collections in this category
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              Be the first to create a {categoryLabel.toLowerCase()} gift guide!
            </p>
            <Link
              href="/collections/new"
              className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Create Collection
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                  {collection.age_range && (
                    <span className="mt-2 inline-block rounded-full bg-cream-dark px-2 py-0.5 text-xs text-foreground/60">
                      Ages {collection.age_range}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
