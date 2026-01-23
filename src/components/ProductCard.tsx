"use client";

import { useState } from "react";
import Image from "next/image";
import { WishlistItem, WishlistStatus } from "@/lib/types";

interface ProductCardProps {
  item: WishlistItem & { display_order?: number };
  showPrice?: boolean;
  isOwner?: boolean;
  onClaim?: () => void;
  onQuickView?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  claimedBy?: string[];
  variant?: "default" | "large" | "compact" | "minimal";
}

const statusConfig: Record<
  WishlistStatus,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  available: {
    label: "Available",
    bgClass: "bg-white/90 backdrop-blur-sm",
    textClass: "text-foreground/80",
    dotClass: "bg-green-500",
  },
  reserved: {
    label: "Reserved",
    bgClass: "bg-white/90 backdrop-blur-sm",
    textClass: "text-foreground/60",
    dotClass: "bg-amber-500",
  },
  purchased: {
    label: "Purchased",
    bgClass: "bg-white/90 backdrop-blur-sm",
    textClass: "text-foreground/50",
    dotClass: "bg-gray-400",
  },
};

export default function ProductCard({
  item,
  showPrice = true,
  isOwner = false,
  onClaim,
  onQuickView,
  onSave,
  isSaved = false,
  claimedBy,
  variant = "default",
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const displayUrl = item.affiliate_url || item.url;
  const status = statusConfig[item.status];
  const canClaim = item.status === "available" && !isOwner && onClaim;

  // ShopMy-style: taller images for better product display
  const imageHeight =
    variant === "large"
      ? "aspect-[3/4]"
      : variant === "compact"
      ? "aspect-square"
      : variant === "minimal"
      ? "aspect-[4/5]"
      : "aspect-[3/4]";

  // Minimal variant for cleaner grid displays (ShopMy style)
  if (variant === "minimal") {
    return (
      <a
        href={displayUrl}
        target="_blank"
        rel="noreferrer"
        className="group block"
      >
        <div className={`relative ${imageHeight} w-full overflow-hidden rounded-xl bg-gray-50`}>
          {item.image_url && !imageError ? (
            <Image
              src={item.image_url}
              alt={item.title || "Product"}
              fill
              className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Save button - ShopMy style */}
          {onSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSave();
              }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isSaved
                  ? "bg-red text-white"
                  : "bg-white/80 backdrop-blur-sm text-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red"
              }`}
            >
              <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-2.5 px-0.5">
          <p className="text-sm text-foreground/90 line-clamp-2 leading-snug font-medium">
            {item.title || "View Product"}
          </p>
          {showPrice && item.price && (
            <p className="mt-1 text-sm font-semibold text-foreground">
              ${item.price.toFixed(2)}
            </p>
          )}
        </div>
      </a>
    );
  }

  return (
    <div className="group relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      {/* Image Container - Cleaner, more minimal */}
      <div className={`relative ${imageHeight} w-full overflow-hidden bg-gray-50`}>
        {item.image_url && !imageError ? (
          <Image
            src={item.image_url}
            alt={item.title || "Product"}
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

        {/* Status Badge - Cleaner pill style */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bgClass} ${status.textClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            {status.label}
          </span>
        </div>

        {/* Save/Heart Button - ShopMy style top right */}
        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSaved
                ? "bg-red text-white shadow-md"
                : "bg-white/90 backdrop-blur-sm text-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red hover:bg-white shadow-sm"
            }`}
          >
            <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Quantity Badge */}
        {item.quantity > 1 && (
          <div className="absolute bottom-3 left-3">
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground/70 shadow-sm">
              {item.quantity - item.quantity_claimed} needed
            </span>
          </div>
        )}

        {/* Quick Actions - Clean overlay on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/40 via-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-foreground text-center shadow-lg hover:bg-gray-50 transition-colors"
            >
              Shop Now
            </a>
            {canClaim && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim();
                }}
                className="rounded-full bg-red px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-red-hover transition-colors"
              >
                Claim
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Cleaner typography */}
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-2 leading-snug text-[15px]">
          {item.title || item.url}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          {showPrice && item.price && (
            <span className="text-lg font-bold text-foreground">
              ${item.price.toFixed(2)}
            </span>
          )}
          {item.retailer && (
            <span className="text-xs text-foreground/50 capitalize">
              {item.retailer}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="mt-2 text-sm text-foreground/60 line-clamp-2">
            {item.notes}
          </p>
        )}

        {/* Owner sees who claimed - cleaner style */}
        {isOwner && claimedBy && claimedBy.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Claimed by {claimedBy.join(", ")}
          </div>
        )}

        {/* Mobile Actions - Show always on mobile */}
        <div className="mt-3 flex gap-2 md:hidden">
          <a
            href={displayUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-center text-sm font-medium hover:bg-foreground/10 transition-colors"
          >
            Shop Now
          </a>
          {canClaim && (
            <button
              onClick={onClaim}
              className="flex-1 rounded-xl bg-red px-3 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
