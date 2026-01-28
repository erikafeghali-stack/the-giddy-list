"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { generateTrackingUrl } from "@/lib/earnings";

interface GuideProductCardProps {
  product: Product & {
    ai_description?: string | null;
    highlight_reason?: string | null;
    display_order?: number;
  };
  guideId?: string;
  variant?: "default" | "featured";
}

export default function GuideProductCard({
  product,
  guideId,
  variant = "default",
}: GuideProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Generate tracking URL for affiliate click tracking
  const trackingUrl = guideId
    ? generateTrackingUrl(
        product.affiliate_url || product.original_url,
        guideId,
        "gift_guide",
        product.id
      )
    : product.affiliate_url || product.original_url;

  const isFeatured = variant === "featured" || !!product.highlight_reason;

  return (
    <article className={`group relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-lg border ${isFeatured ? "border-red/20" : "border-gray-100"}`}>
      {/* Featured Badge */}
      {product.highlight_reason && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-red/10 px-3 py-1 text-xs font-medium text-red">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {product.highlight_reason}
          </span>
        </div>
      )}

      {/* Image Container */}
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
          {product.image_url && !imageError ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Price Badge */}
          {product.price && (
            <div className="absolute bottom-3 left-3">
              <span className="rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-foreground shadow-sm">
                ${product.price.toFixed(2)}
              </span>
            </div>
          )}

          {/* Shop Button on Hover */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="block w-full rounded-full bg-red py-2.5 text-center text-sm font-medium text-white shadow-lg">
              Shop Now
            </span>
          </div>
        </div>
      </a>

      {/* Content */}
      <div className="p-4">
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
        >
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug text-[15px] hover:text-red transition-colors">
            {product.title}
          </h3>
        </a>

        {/* Rating */}
        {product.rating && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.rating!)
                      ? "text-yellow-400"
                      : "text-gray-200"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-foreground/50">
              {product.rating.toFixed(1)}
              {product.review_count && ` (${product.review_count.toLocaleString()})`}
            </span>
          </div>
        )}

        {/* AI Description */}
        {product.ai_description && (
          <p className="mt-2 text-sm text-foreground/70 line-clamp-3 leading-relaxed">
            {product.ai_description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.age_range && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-foreground/60">
              Ages {product.age_range}
            </span>
          )}
          {product.brand && (
            <span className="text-xs text-foreground/50">
              {product.brand}
            </span>
          )}
          {product.retailer && (
            <span className="text-xs text-foreground/40 capitalize">
              via {product.retailer}
            </span>
          )}
        </div>

        {/* Mobile Shop Button */}
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-4 block md:hidden"
        >
          <span className="block w-full rounded-xl bg-red px-4 py-3 text-center text-sm font-medium text-white">
            Shop Now
          </span>
        </a>
      </div>
    </article>
  );
}
