"use client";

import Link from "next/link";
import Image from "next/image";
import { Collection, CreatorProfile } from "@/lib/types";
import Avatar from "./Avatar";

interface CollectionCardProps {
  collection: Collection & { creator_profiles?: CreatorProfile };
  showCreator?: boolean;
}

export default function CollectionCard({
  collection,
  showCreator = true,
}: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative aspect-[4/3] bg-cream-dark">
        {collection.cover_image_url ? (
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
        {!collection.is_public && (
          <div className="absolute top-3 right-3 rounded-full bg-foreground/80 px-2 py-1 text-xs text-white">
            Private
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-red transition-colors">
          {collection.title}
        </h3>

        {showCreator && collection.creator_profiles && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar
              src={collection.creator_profiles.avatar_url}
              name={collection.creator_profiles.display_name}
              size="xs"
            />
            <span className="text-xs text-foreground/60 truncate">
              {collection.creator_profiles.display_name ||
                collection.creator_profiles.username}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {collection.age_range && (
            <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-foreground/60">
              Ages {collection.age_range}
            </span>
          )}
          {collection.category && (
            <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-foreground/60 capitalize">
              {collection.category.replace("-", " ")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
