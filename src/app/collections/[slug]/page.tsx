"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CollectionItem, CreatorProfile } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface CollectionData extends Collection {
  items: CollectionItem[];
  creator_profiles: CreatorProfile;
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCollection() {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user?.id;

      // Load collection with items and creator
      const { data, error: fetchError } = await supabase
        .from("collections")
        .select("*, collection_items(*), creator_profiles(*)")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        setError("Collection not found");
        setLoading(false);
        return;
      }

      const c = data as CollectionData;

      // Check if private and not owner
      if (!c.is_public && c.user_id !== currentUserId) {
        setError("This collection is private");
        setLoading(false);
        return;
      }

      setCollection(c);
      setIsOwner(c.user_id === currentUserId);

      // Increment view count
      if (c.user_id !== currentUserId) {
        await supabase.rpc("increment_collection_views", {
          collection_slug: slug,
        });
      }

      setLoading(false);
    }

    loadCollection();
  }, [slug]);

  async function copyShareLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Loading collection...</p>
        </div>
      </main>
    );
  }

  if (error || !collection) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl bg-white p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">
              {error || "Collection not found"}
            </div>
            <p className="mt-2 text-foreground/50">
              This collection may be private or no longer exists.
            </p>
            <Link
              href="/discover"
              className="mt-5 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
      {/* Cover Image - Taller, more impactful like registry */}
      {collection.cover_image_url && (
        <div className="relative h-56 md:h-80 bg-gray-100">
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="mx-auto max-w-5xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                {collection.title}
              </h1>
              <Link
                href={`/${collection.creator_profiles?.username}`}
                className="mt-3 inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Avatar
                  src={collection.creator_profiles?.avatar_url}
                  name={collection.creator_profiles?.display_name}
                  size="sm"
                  className="ring-2 ring-white/30"
                />
                <span className="text-sm text-white/90">
                  by{" "}
                  <span className="font-medium text-white">
                    {collection.creator_profiles?.display_name ||
                      collection.creator_profiles?.username}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Header - Only show if no cover image */}
        {!collection.cover_image_url && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {collection.title}
            </h1>
            <Link
              href={`/${collection.creator_profiles?.username}`}
              className="mt-3 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={collection.creator_profiles?.avatar_url}
                name={collection.creator_profiles?.display_name}
                size="sm"
              />
              <span className="text-sm text-foreground/70">
                by{" "}
                <span className="font-medium text-foreground">
                  {collection.creator_profiles?.display_name ||
                    collection.creator_profiles?.username}
                </span>
              </span>
            </Link>
          </div>
        )}

        {/* Action Bar - Clean, minimal */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            {collection.description && (
              <p className="text-foreground/60 max-w-xl text-sm">
                {collection.description}
              </p>
            )}

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {collection.age_range && (
                <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-foreground/70">
                  Ages {collection.age_range}
                </span>
              )}
              {collection.category && (
                <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-foreground/70 capitalize">
                  {collection.category.replace("-", " ")}
                </span>
              )}
              <span className="text-xs text-foreground/40">
                {collection.view_count.toLocaleString()} views
              </span>
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={copyShareLink}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>
            {isOwner && (
              <Link
                href={`/collections/${collection.slug}/edit`}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div>
          {collection.items.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-foreground">
                No items yet
              </div>
              <p className="mt-2 text-foreground/50">
                {isOwner
                  ? "Add items to your collection to share with others!"
                  : "This collection doesn't have any items yet."}
              </p>
              {isOwner && (
                <Link
                  href={`/collections/${collection.slug}/edit`}
                  className="mt-5 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                >
                  Add Items
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {collection.items
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <a
                    key={item.id}
                    href={item.product_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    {/* Image - Taller aspect ratio like ShopMy */}
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_title || "Product"}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Price overlay */}
                      {item.product_price && (
                        <div className="absolute bottom-3 left-3">
                          <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                            ${item.product_price.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Shop button on hover */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="block w-full rounded-full bg-red py-2.5 text-center text-sm font-medium text-white shadow-lg">
                          Shop Now
                        </span>
                      </div>
                    </div>

                    {/* Title below image */}
                    <div className="mt-3">
                      <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug">
                        {item.product_title || "Untitled"}
                      </h3>
                      {item.caption && (
                        <p className="mt-1 text-xs text-foreground/50 line-clamp-2">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
