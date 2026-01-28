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

  const trackingUrl = guideId
    ? generateTrackingUrl(
        product.affiliate_url || product.original_url,
        guideId,
        "gift_guide",
        product.id
      )
    : product.affiliate_url || product.original_url;

  const hasImage = product.image_url && !imageError;

  // Featured variant: horizontal layout with large image
  if (variant === "featured") {
    return (
      <article className="group relative rounded-2xl bg-white overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block relative aspect-square md:aspect-auto bg-gray-50"
          >
            {hasImage ? (
              <Image
                src={product.image_url!}
                alt={product.title}
                fill
                className="object-contain p-6 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <ProductImageFallback brand={product.brand} title={product.title} size="lg" />
                </div>
              </div>
            )}

            {/* Featured badge */}
            {product.highlight_reason && (
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {product.highlight_reason}
                </span>
              </div>
            )}
          </a>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-4">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block flex-1"
              >
                <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug hover:text-red transition-colors">
                  {product.title}
                </h3>
              </a>
              {product.price && (
                <span className="shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {product.brand && (
              <p className="mt-1.5 text-sm text-foreground/50 font-medium">
                by {product.brand}
              </p>
            )}

            {/* Rating */}
            {product.rating && (
              <div className="mt-3 flex items-center gap-2">
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
                <span className="text-sm text-foreground/50">
                  {product.rating.toFixed(1)}
                  {product.review_count &&
                    ` (${product.review_count.toLocaleString()} reviews)`}
                </span>
              </div>
            )}

            {/* Description */}
            {product.ai_description && (
              <p className="mt-4 text-foreground/70 leading-relaxed">
                {product.ai_description}
              </p>
            )}

            {/* Age & Category Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {product.age_range && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-foreground/60">
                  Ages {product.age_range}
                </span>
              )}
              {product.retailer && (
                <span className="text-xs text-foreground/40 capitalize">
                  Available on {product.retailer}
                </span>
              )}
            </div>

            {/* CTA Button */}
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-hover transition-colors shadow-sm"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Default variant: vertical card
  return (
    <article className="group relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      {/* Highlight Badge */}
      {product.highlight_reason && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-red/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
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
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          {hasImage ? (
            <Image
              src={product.image_url!}
              alt={product.title}
              fill
              className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ProductImageFallback brand={product.brand} title={product.title} size="md" />
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

          {/* Shop Overlay on Hover */}
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

        {product.brand && (
          <p className="mt-1 text-xs text-foreground/40">{product.brand}</p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${
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
            <span className="text-xs text-foreground/40">
              {product.rating.toFixed(1)}
              {product.review_count && ` (${product.review_count.toLocaleString()})`}
            </span>
          </div>
        )}

        {/* AI Description */}
        {product.ai_description && (
          <p className="mt-2 text-sm text-foreground/60 line-clamp-2 leading-relaxed">
            {product.ai_description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.age_range && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-foreground/50">
              Ages {product.age_range}
            </span>
          )}
          {product.retailer && (
            <span className="text-xs text-foreground/30 capitalize">
              {product.retailer}
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

// Styled fallback when no product image is available
function ProductImageFallback({
  brand,
  title,
  size = "md",
}: {
  brand?: string | null;
  title: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = (brand || title).charAt(0).toUpperCase();
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-16 h-16 text-xl",
    lg: "w-20 h-20 text-2xl",
  };
  const textSize = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-red/10 to-red/5 flex items-center justify-center font-bold text-red/40`}
      >
        {initial}
      </div>
      <p className={`${textSize[size]} text-foreground/30 text-center max-w-[80%] line-clamp-2`}>
        {title}
      </p>
    </div>
  );
}
