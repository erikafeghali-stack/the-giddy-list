"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Collection, WishlistItem } from "@/lib/types";

interface AddToCollectionModalProps {
  item: WishlistItem;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddToCollectionModal({
  item,
  onClose,
  onAdded,
}: AddToCollectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadCollections() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) return;

      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      setCollections((data || []) as Collection[]);

      // Check which collections already have this item
      const { data: existingItems } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("wishlist_id", item.id);

      if (existingItems) {
        setAddedTo(new Set(existingItems.map((i) => i.collection_id)));
      }

      setLoading(false);
    }

    loadCollections();
  }, [item.id]);

  async function handleAdd(collectionId: string) {
    setAdding(collectionId);

    const { error } = await supabase.from("collection_items").insert({
      collection_id: collectionId,
      wishlist_id: item.id,
      product_url: item.affiliate_url || item.url,
      product_title: item.title,
      product_image_url: item.image_url,
      product_price: item.price,
      display_order: 0,
    });

    if (!error) {
      setAddedTo(new Set([...addedTo, collectionId]));
      onAdded?.();
    }

    setAdding(null);
  }

  async function handleRemove(collectionId: string) {
    setAdding(collectionId);

    await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("wishlist_id", item.id);

    const newSet = new Set(addedTo);
    newSet.delete(collectionId);
    setAddedTo(newSet);

    setAdding(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-card shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Add to Collection</h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Item Preview */}
        <div className="p-4 border-b border-border bg-cream-dark/30">
          <div className="flex items-center gap-3">
            {item.image_url && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                <Image
                  src={item.image_url}
                  alt={item.title || "Product"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm truncate">
                {item.title || item.url}
              </div>
              {item.price && (
                <div className="text-xs text-gold font-semibold">
                  ${item.price.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-sm text-foreground/50 text-center py-4">
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-sm text-foreground/60 mb-3">
                You don't have any collections yet
              </div>
              <Link
                href="/collections/new"
                className="inline-block rounded-xl bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                onClick={onClose}
              >
                Create Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => {
                const isAdded = addedTo.has(collection.id);
                const isLoading = adding === collection.id;

                return (
                  <button
                    key={collection.id}
                    onClick={() =>
                      isAdded
                        ? handleRemove(collection.id)
                        : handleAdd(collection.id)
                    }
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 transition-colors text-left disabled:opacity-50 ${
                      isAdded
                        ? "border-red bg-red-light"
                        : "border-border hover:bg-cream-dark"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isAdded ? "border-red bg-red" : "border-border"
                      }`}
                    >
                      {isAdded && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">
                        {collection.title}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {collection.is_public ? "Public" : "Private"}
                        {collection.age_range && ` · Ages ${collection.age_range}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link
            href="/collections/new"
            className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground text-center hover:bg-cream-dark transition-colors"
            onClick={onClose}
          >
            Create New Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
