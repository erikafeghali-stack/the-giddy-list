"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CollectionItem, WishlistItem, AgeRange, CollectionCategory } from "@/lib/types";

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: "0-2", label: "0-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "6-8", label: "6-8 years" },
  { value: "9-12", label: "9-12 years" },
  { value: "13-18", label: "13-18 years" },
];

const CATEGORIES: { value: CollectionCategory; label: string }[] = [
  { value: "toys", label: "Toys & Games" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "gear", label: "Gear & Equipment" },
  { value: "room-decor", label: "Room Decor" },
  { value: "outdoor", label: "Outdoor & Sports" },
  { value: "arts-crafts", label: "Arts & Crafts" },
  { value: "electronics", label: "Electronics" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

interface CollectionData extends Collection {
  items: CollectionItem[];
}

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const [category, setCategory] = useState<CollectionCategory | "">("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [scraping, setScraping] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCollection() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("collections")
        .select("*, collection_items(*)")
        .eq("slug", slug)
        .eq("user_id", sessionData.session.user.id)
        .single();

      if (fetchError || !data) {
        router.push("/collections");
        return;
      }

      const c = data as CollectionData;
      setCollection(c);
      setTitle(c.title);
      setDescription(c.description || "");
      setAgeRange((c.age_range as AgeRange) || "");
      setCategory((c.category as CollectionCategory) || "");
      setIsPublic(c.is_public);
      setCoverImageUrl(c.cover_image_url);
      setItems(c.items.sort((a, b) => a.display_order - b.display_order));

      // Load user's wishlist items for adding to collection
      const { data: wishlistData } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      setWishlistItems((wishlistData || []) as WishlistItem[]);
      setLoading(false);
    }

    loadCollection();
  }, [slug, router]);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!collection || !title.trim()) return;

    setError(null);
    setSuccess(false);
    setSaving(true);

    const { error: updateError } = await supabase
      .from("collections")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        age_range: ageRange || null,
        category: category || null,
        is_public: isPublic,
        cover_image_url: coverImageUrl,
      })
      .eq("id", collection.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Update item order
    for (let i = 0; i < items.length; i++) {
      await supabase
        .from("collection_items")
        .update({ display_order: i })
        .eq("id", items[i].id);
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleDelete() {
    if (!collection) return;
    if (!confirm("Are you sure you want to delete this collection?")) return;

    await supabase.from("collections").delete().eq("id", collection.id);
    router.push("/collections");
  }

  // Auto-scrape when URL changes
  useEffect(() => {
    const url = newProductUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) return;

    const timer = setTimeout(async () => {
      setScraping(true);
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          if (!newProductTitle && data.data.title) {
            setNewProductTitle(data.data.title);
          }
          if (!newProductImage && data.data.image_url) {
            setNewProductImage(data.data.image_url);
          }
          if (!newProductPrice && data.data.price) {
            setNewProductPrice(data.data.price.toString());
          }
        }
      } catch {
        // Ignore scrape errors
      }
      setScraping(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [newProductUrl]);

  async function addItemFromUrl() {
    if (!collection || !newProductUrl.trim()) return;

    setAddingItem(true);

    const { data, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collection.id,
        product_url: newProductUrl.trim(),
        product_title: newProductTitle.trim() || null,
        product_image_url: newProductImage.trim() || null,
        product_price: newProductPrice ? parseFloat(newProductPrice) : null,
        caption: newCaption.trim() || null,
        display_order: items.length,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data as CollectionItem]);
      setNewProductUrl("");
      setNewProductTitle("");
      setNewProductImage("");
      setNewProductPrice("");
      setNewCaption("");
      setShowAddModal(false);
    }

    setAddingItem(false);
  }

  async function addItemFromWishlist(wishlistItem: WishlistItem) {
    if (!collection) return;

    setAddingItem(true);

    const { data, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collection.id,
        wishlist_id: wishlistItem.id,
        product_url: wishlistItem.affiliate_url || wishlistItem.url,
        product_title: wishlistItem.title,
        product_image_url: wishlistItem.image_url,
        product_price: wishlistItem.price,
        display_order: items.length,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data as CollectionItem]);
      setShowAddModal(false);
    }

    setAddingItem(false);
  }

  async function removeItem(itemId: string) {
    await supabase.from("collection_items").delete().eq("id", itemId);
    setItems(items.filter((i) => i.id !== itemId));
  }

  function moveItem(index: number, direction: "up" | "down") {
    const newItems = [...items];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-4xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/collections/${slug}`}
              className="rounded-xl p-2 hover:bg-cream-dark transition-colors"
            >
              <svg
                className="w-5 h-5 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Collection</h1>
              <p className="text-sm text-foreground/60">
                Update your collection details and items
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-xl border border-red/30 bg-red-light px-4 py-2 text-sm text-red hover:bg-red/10 transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Cover Image */}
        <div
          className="relative h-40 rounded-2xl bg-cream-dark overflow-hidden cursor-pointer group mb-6"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
            <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm text-foreground">
                {coverImageUrl ? "Change cover" : "Add cover image"}
              </span>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm resize-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Age Range
              </label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
              >
                <option value="">Select age range</option>
                {AGE_RANGES.map((age) => (
                  <option key={age.value} value={age.value}>
                    {age.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CollectionCategory)}
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-cream-dark rounded-full peer peer-checked:bg-red transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  Public Collection
                </div>
                <div className="text-xs text-foreground/60">
                  Allow others to discover this collection
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Items Section */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Items</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-foreground/50 mb-2">No items yet</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm text-red hover:text-red-hover transition-colors"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 bg-cream-dark/30"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                      className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Image */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                    {item.product_image_url ? (
                      <Image
                        src={item.product_image_url}
                        alt={item.product_title || "Product"}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-foreground/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {item.product_title || "Untitled"}
                    </div>
                    {item.product_price && (
                      <div className="text-sm text-gold font-semibold">
                        ${item.product_price.toFixed(2)}
                      </div>
                    )}
                    {item.caption && (
                      <div className="text-xs text-foreground/60 truncate">
                        {item.caption}
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red hover:bg-red-light rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-6 rounded-xl bg-red-light border border-red/20 px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Collection saved successfully!
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="mt-6 w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Add Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-foreground/60 hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Add from URL */}
            <div className="space-y-3 mb-6">
              <div className="text-sm font-medium text-foreground">Add from URL</div>
              <input
                type="url"
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                placeholder="Paste product URL"
                className="w-full rounded-xl border border-border bg-card p-3 text-sm"
              />
              {scraping && (
                <div className="text-xs text-foreground/50">Fetching product info...</div>
              )}
              {newProductUrl && (
                <>
                  <input
                    type="text"
                    value={newProductTitle}
                    onChange={(e) => setNewProductTitle(e.target.value)}
                    placeholder="Product title"
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      placeholder="Image URL"
                      className="rounded-xl border border-border bg-card p-3 text-sm"
                    />
                    <input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="Price"
                      className="rounded-xl border border-border bg-card p-3 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="Caption (optional)"
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm"
                  />
                  <button
                    onClick={addItemFromUrl}
                    disabled={addingItem || !newProductUrl.trim()}
                    className="w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
                  >
                    {addingItem ? "Adding..." : "Add Item"}
                  </button>
                </>
              )}
            </div>

            {/* Add from Wishlist */}
            {wishlistItems.length > 0 && (
              <div>
                <div className="text-sm font-medium text-foreground mb-3">
                  Or add from your wishlist
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {wishlistItems
                    .filter((w) => !items.some((i) => i.wishlist_id === w.id))
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addItemFromWishlist(item)}
                        disabled={addingItem}
                        className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-cream-dark transition-colors text-left disabled:opacity-50"
                      >
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
                        <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
