"use client";

import Link from "next/link";
import Image from "next/image";
import { GiftGuide } from "@/lib/types";

interface RelatedGuidesProps {
  guides: GiftGuide[];
  currentSlug: string;
}

export default function RelatedGuides({ guides, currentSlug }: RelatedGuidesProps) {
  // Filter out current guide and limit to 4
  const relatedGuides = guides
    .filter((g) => g.slug !== currentSlug)
    .slice(0, 4);

  if (relatedGuides.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">
      <h2 className="text-xl font-bold text-foreground mb-6">
        More Gift Guides
      </h2>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
        {relatedGuides.map((guide) => (
          <Link
            key={guide.id}
            href={`/guides/${guide.slug}`}
            className="group block"
          >
            {/* Cover Image */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100">
              {guide.cover_image_url ? (
                <Image
                  src={guide.cover_image_url}
                  alt={guide.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red/10 to-red/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Category Badge */}
              {(guide.age_range || guide.category) && (
                <div className="absolute top-2 left-2">
                  <span className="inline-block rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-foreground/70">
                    {guide.age_range ? `Ages ${guide.age_range}` : guide.category?.replace('-', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mt-2.5">
              <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug group-hover:text-red transition-colors">
                {guide.title}
              </h3>
              <p className="mt-1 text-xs text-foreground/50">
                {guide.view_count.toLocaleString()} views
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
