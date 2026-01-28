"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import GuideProductCard from "@/components/GuideProductCard";
import RelatedGuides from "@/components/RelatedGuides";
import { GiftGuide, Product } from "@/lib/types";

interface GuideClientProps {
  guide: GiftGuide;
  products: Array<
    Product & {
      ai_description: string | null;
      highlight_reason: string | null;
      display_order: number;
    }
  >;
  relatedGuides: GiftGuide[];
}

export default function GuideClient({
  guide,
  products,
  relatedGuides,
}: GuideClientProps) {
  const [copied, setCopied] = useState(false);

  async function copyShareLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Format date for display
  const publishedDate = guide.published_at
    ? new Date(guide.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-red/5 to-transparent">
        {guide.cover_image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={guide.cover_image_url}
              alt=""
              fill
              className="object-cover opacity-10"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-[#FAFAF8]" />
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-foreground/50 mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-foreground transition-colors">
              Gift Guides
            </Link>
            <span>/</span>
            <span className="text-foreground/70 truncate">{guide.title}</span>
          </nav>

          {/* Title & Meta */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight max-w-3xl">
            {guide.title}
          </h1>

          {/* Tags & Date */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {guide.age_range && (
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-foreground/70">
                Ages {guide.age_range}
              </span>
            )}
            {guide.category && (
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-foreground/70 capitalize">
                {guide.category.replace("-", " ")}
              </span>
            )}
            {guide.occasion && (
              <span className="rounded-full bg-red/10 px-3 py-1 text-sm font-medium text-red capitalize">
                {guide.occasion.replace("-", " ")}
              </span>
            )}
            {publishedDate && (
              <span className="text-sm text-foreground/50">
                Updated {publishedDate}
              </span>
            )}
            <span className="text-sm text-foreground/40">
              {guide.view_count.toLocaleString()} views
            </span>
          </div>

          {/* Share Button */}
          <div className="mt-6">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {copied ? "Link Copied!" : "Share Guide"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6">
        {/* Intro Content */}
        {guide.intro_content && (
          <div className="mb-10">
            <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed">
              {guide.intro_content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {products.length} Gift{products.length !== 1 ? "s" : ""} We Love
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
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
              <div className="text-xl font-semibold text-foreground">
                No products yet
              </div>
              <p className="mt-2 text-foreground/50">
                Check back soon for our curated recommendations.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products
                .sort((a, b) => a.display_order - b.display_order)
                .map((product) => (
                  <GuideProductCard
                    key={product.id}
                    product={product}
                    guideId={guide.id}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Affiliate Disclosure */}
        <div className="mt-10 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs text-foreground/50 leading-relaxed">
            <strong>Disclosure:</strong> The Giddy List may earn a small
            commission when you purchase through links on this page. This helps
            support our team and allows us to continue providing quality gift
            recommendations. All opinions are our own and products are selected
            based on quality and value.
          </p>
        </div>

        {/* Related Guides */}
        <RelatedGuides guides={relatedGuides} currentSlug={guide.slug} />
      </div>
    </main>
  );
}
