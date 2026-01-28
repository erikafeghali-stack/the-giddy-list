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

// Category-themed gradient backgrounds
const CATEGORY_GRADIENTS: Record<string, string> = {
  toys: "from-purple-50 via-pink-50 to-rose-50",
  books: "from-amber-50 via-orange-50 to-yellow-50",
  clothing: "from-sky-50 via-blue-50 to-indigo-50",
  gear: "from-slate-50 via-gray-50 to-zinc-50",
  outdoor: "from-emerald-50 via-green-50 to-teal-50",
  "arts-crafts": "from-fuchsia-50 via-violet-50 to-purple-50",
  electronics: "from-cyan-50 via-sky-50 to-blue-50",
  sports: "from-orange-50 via-red-50 to-rose-50",
  "room-decor": "from-rose-50 via-pink-50 to-fuchsia-50",
  default: "from-red-50/50 via-rose-50/30 to-amber-50/50",
};

const CATEGORY_ACCENTS: Record<string, string> = {
  toys: "bg-purple-100 text-purple-700",
  books: "bg-amber-100 text-amber-700",
  clothing: "bg-sky-100 text-sky-700",
  gear: "bg-slate-100 text-slate-700",
  outdoor: "bg-emerald-100 text-emerald-700",
  "arts-crafts": "bg-violet-100 text-violet-700",
  electronics: "bg-cyan-100 text-cyan-700",
  sports: "bg-orange-100 text-orange-700",
  "room-decor": "bg-pink-100 text-pink-700",
  default: "bg-red/10 text-red",
};

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

  const publishedDate = guide.published_at
    ? new Date(guide.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const sortedProducts = [...products].sort(
    (a, b) => a.display_order - b.display_order
  );

  // Get products with images for the hero mosaic
  const productsWithImages = sortedProducts.filter((p) => p.image_url);
  const heroProducts = productsWithImages.slice(0, 4);
  const featuredProduct = sortedProducts[0];

  const gradient =
    CATEGORY_GRADIENTS[guide.category || ""] || CATEGORY_GRADIENTS.default;
  const accent =
    CATEGORY_ACCENTS[guide.category || ""] || CATEGORY_ACCENTS.default;

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-br ${gradient}`}>
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-foreground/40 mb-8">
            <Link
              href="/"
              className="hover:text-foreground/70 transition-colors"
            >
              Home
            </Link>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <Link
              href="/guides"
              className="hover:text-foreground/70 transition-colors"
            >
              Gift Guides
            </Link>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-foreground/60 truncate max-w-[200px]">
              {guide.title}
            </span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Title & Info */}
            <div>
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {guide.age_range && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${accent}`}
                  >
                    Ages {guide.age_range}
                  </span>
                )}
                {guide.category && (
                  <span className="rounded-full bg-white/80 border border-gray-200 px-3 py-1 text-xs font-medium text-foreground/60 capitalize">
                    {guide.category.replace("-", " ")}
                  </span>
                )}
                {guide.occasion && (
                  <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red capitalize">
                    {guide.occasion.replace("-", " ")}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
                {guide.title}
              </h1>

              {/* Meta info */}
              <div className="mt-4 flex items-center gap-4 text-sm text-foreground/40">
                {publishedDate && <span>Updated {publishedDate}</span>}
                <span>{products.length} products</span>
                <span>
                  {guide.view_count.toLocaleString()} views
                </span>
              </div>

              {/* Share */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>

            {/* Right: Product Image Mosaic */}
            <div className="relative">
              {heroProducts.length >= 4 ? (
                <div className="grid grid-cols-2 gap-3">
                  {heroProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`relative rounded-2xl overflow-hidden bg-white shadow-sm ${
                        index === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                      }`}
                    >
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-contain p-3"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <ProductPlaceholderIcon />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : heroProducts.length > 0 ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-sm">
                  <Image
                    src={heroProducts[0].image_url!}
                    alt={heroProducts[0].title}
                    fill
                    className="object-contain p-6"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white/60 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <GiftIcon className="w-16 h-16 mx-auto text-foreground/15 mb-3" />
                    <p className="text-foreground/40 text-sm font-medium">
                      {products.length} curated picks inside
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-5xl px-6">
        {/* Intro Content */}
        {guide.intro_content && (
          <div className="py-10 border-b border-gray-100">
            <div className="max-w-3xl">
              {guide.intro_content.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="text-lg text-foreground/70 leading-relaxed mb-4 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <section className="py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Our Top Picks
              </h2>
              <p className="mt-1 text-sm text-foreground/50">
                {products.length} hand-picked gift
                {products.length !== 1 ? "s" : ""} we recommend
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-12 text-center">
              <GiftIcon className="w-12 h-12 mx-auto text-foreground/15 mb-3" />
              <div className="text-lg font-semibold text-foreground">
                No products yet
              </div>
              <p className="mt-2 text-foreground/50">
                Check back soon for our curated recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Featured first product - larger card */}
              {featuredProduct && (
                <div className="mb-8">
                  <GuideProductCard
                    product={featuredProduct}
                    guideId={guide.id}
                    variant="featured"
                  />
                </div>
              )}

              {/* Rest of the products in a grid */}
              {sortedProducts.length > 1 && (
                <div className="grid gap-5 grid-cols-2 md:grid-cols-3">
                  {sortedProducts.slice(1).map((product) => (
                    <GuideProductCard
                      key={product.id}
                      product={product}
                      guideId={guide.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Affiliate Disclosure */}
        <div className="py-6 border-t border-gray-100">
          <p className="text-xs text-foreground/40 leading-relaxed">
            <strong className="text-foreground/50">Disclosure:</strong> The
            Giddy List may earn a small commission when you purchase through
            links on this page. This helps support our team and allows us to
            continue providing quality gift recommendations. All opinions are our
            own and products are selected based on quality and value.
          </p>
        </div>

        {/* Related Guides */}
        <RelatedGuides guides={relatedGuides} currentSlug={guide.slug} />
      </div>
    </main>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
      />
    </svg>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg
      className="w-8 h-8 text-foreground/15"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
