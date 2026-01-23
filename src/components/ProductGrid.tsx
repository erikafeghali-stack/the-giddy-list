"use client";

import { useState, useMemo } from "react";
import { WishlistItem, GiftClaim } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  items: (WishlistItem & { display_order?: number })[];
  claims?: GiftClaim[];
  showPrices?: boolean;
  isOwner?: boolean;
  onClaimItem?: (item: WishlistItem) => void;
  onSaveItem?: (item: WishlistItem) => void;
  savedItems?: string[];
  emptyMessage?: string;
  columns?: 2 | 3 | 4;
  showSearch?: boolean;
  variant?: "default" | "minimal";
}

export default function ProductGrid({
  items,
  claims = [],
  showPrices = true,
  isOwner = false,
  onClaimItem,
  onSaveItem,
  savedItems = [],
  emptyMessage = "No items yet",
  columns = 3,
  showSearch = false,
  variant = "default",
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high">("default");

  const columnClasses = {
    2: "grid-cols-2 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query) ||
          item.retailer?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [items, searchQuery, sortBy]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-16 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-foreground/20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <div className="text-xl font-semibold text-foreground">{emptyMessage}</div>
        <p className="mt-2 text-foreground/50">
          Items added to this list will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search & Sort Bar - ShopMy style */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-xl border-0 bg-gray-50 pl-11 pr-4 py-3 text-sm placeholder:text-foreground/40 focus:ring-2 focus:ring-red/20 focus:bg-white transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "default" | "price-low" | "price-high")}
            className="rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-foreground/70 focus:ring-2 focus:ring-red/20 focus:bg-white transition-all"
          >
            <option value="default">Sort by: Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      )}

      {/* Results count */}
      {showSearch && searchQuery && (
        <p className="mb-4 text-sm text-foreground/50">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
        </p>
      )}

      {/* Grid */}
      <div className={`grid gap-4 ${columnClasses[columns]}`}>
        {filteredItems.map((item) => {
          const itemClaims = claims.filter((c) => c.wishlist_id === item.id);
          const claimedBy = itemClaims.map((c) => c.guest_name || "Anonymous");

          return (
            <ProductCard
              key={item.id}
              item={item}
              showPrice={showPrices}
              isOwner={isOwner}
              claimedBy={claimedBy}
              onClaim={onClaimItem ? () => onClaimItem(item) : undefined}
              onSave={onSaveItem ? () => onSaveItem(item) : undefined}
              isSaved={savedItems.includes(item.id)}
              variant={variant === "minimal" ? "minimal" : "default"}
            />
          );
        })}
      </div>

      {/* No results */}
      {showSearch && searchQuery && filteredItems.length === 0 && (
        <div className="rounded-2xl bg-gray-50 p-12 text-center mt-4">
          <p className="text-foreground/60">No items match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-sm text-red hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
