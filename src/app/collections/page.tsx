"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection } from "@/lib/types";

export default function CollectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    async function loadCollections() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      setCollections((data || []) as Collection[]);
      setLoading(false);
    }

    loadCollections();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
      {/* Header Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                My Collections
              </h1>
              <p className="mt-1 text-foreground/50">
                Create and share gift guides with your followers
              </p>
            </div>
            <Link
              href="/collections/new"
              className="rounded-full bg-red px-5 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              New Collection
            </Link>
          </div>

          {/* Section Navigation - Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-gray-200">
            <Link
              href="/my-kids"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-foreground/60 hover:text-foreground transition-colors"
            >
              My Kids
            </Link>
            <Link
              href="/collections"
              className="px-4 py-3 text-sm font-medium border-b-2 border-red text-red"
            >
              Collections
            </Link>
            <Link
              href="/registry"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-foreground/60 hover:text-foreground transition-colors"
            >
              Registries
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">

        {collections.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">
              No collections yet
            </div>
            <p className="mt-2 text-foreground/50">
              Create your first gift guide to share with others
            </p>
            <Link
              href="/collections/new"
              className="mt-5 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Create Collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group block"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
                  {collection.cover_image_url ? (
                    <Image
                      src={collection.cover_image_url}
                      alt={collection.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {collection.age_range && (
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground/70">
                        Ages {collection.age_range}
                      </span>
                    )}
                  </div>
                  {!collection.is_public && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-foreground/80 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
                        Private
                      </span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white line-clamp-1">
                      {collection.title}
                    </h3>
                  </div>
                </div>

                {/* Meta below */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  {collection.description && (
                    <p className="text-foreground/60 line-clamp-1 flex-1 mr-4">
                      {collection.description}
                    </p>
                  )}
                  <span className="text-xs text-foreground/40 flex-shrink-0">
                    {collection.view_count.toLocaleString()} views
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
