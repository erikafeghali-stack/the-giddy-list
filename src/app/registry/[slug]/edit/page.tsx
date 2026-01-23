"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Kid, WishlistItem, ScrapedProduct } from "@/lib/types";
import { Loader2, Upload, X } from "lucide-react";

interface RegistryData {
  id: string;
  name: string;
  slug: string;
  kid_id: string | null;
  description: string | null;
  occasion: string | null;
  event_date: string | null;
  is_public: boolean;
  show_prices: boolean;
  show_purchased: boolean;
  allow_anonymous_claims: boolean;
  user_id: string;
  cover_image_url: string | null;
}

interface DirectItem {
  id: string;
  url: string;
  title: string;
  price: number | null;
  image_url: string | null;
}

export default function EditRegistryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [registryItemIds, setRegistryItemIds] = useState<string[]>([]);
  const [directItems, setDirectItems] = useState<DirectItem[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [kidId, setKidId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showPurchased, setShowPurchased] = useState(false);
  const [allowAnonymousClaims, setAllowAnonymousClaims] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  // Add item directly state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadRegistry();
  }, [slug]);

  useEffect(() => {
    if (kidId) {
      loadWishlistItems(kidId);
    } else {
      setWishlistItems([]);
    }
  }, [kidId]);

  async function loadRegistry() {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.push("/login");
      return;
    }

    // Load registry
    const { data: registryData, error: registryError } = await supabase
      .from("registries")
      .select("*")
      .eq("slug", slug)
      .single();

    if (registryError || !registryData) {
      setError("Registry not found");
      setLoading(false);
      return;
    }

    if (registryData.user_id !== session.user.id) {
      router.push(`/registry/${slug}`);
      return;
    }

    setRegistry(registryData);
    setName(registryData.name);
    setKidId(registryData.kid_id || "");
    setDescription(registryData.description || "");
    setOccasion(registryData.occasion || "");
    setEventDate(registryData.event_date || "");
    setIsPublic(registryData.is_public);
    setShowPrices(registryData.show_prices);
    setShowPurchased(registryData.show_purchased);
    setAllowAnonymousClaims(registryData.allow_anonymous_claims);
    setCoverImageUrl(registryData.cover_image_url || null);

    // Load kids
    const { data: kidsData } = await supabase
      .from("kids")
      .select("id, name, birthdate")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    setKids((kidsData || []) as Kid[]);

    // Load registry items
    const { data: itemsData } = await supabase
      .from("registry_items")
      .select("wishlist_id")
      .eq("registry_id", registryData.id);

    const itemIds = (itemsData || []).map((i: any) => i.wishlist_id);
    setRegistryItemIds(itemIds);
    setSelectedItems(itemIds);

    // Load direct items (items without a kid)
    const { data: directItemsData } = await supabase
      .from("registry_items")
      .select("wishlist_id, wishlists(*)")
      .eq("registry_id", registryData.id);

    if (directItemsData) {
      const items = directItemsData
        .filter((item: any) => item.wishlists && !item.wishlists.kid_id)
        .map((item: any) => ({
          id: item.wishlists.id,
          url: item.wishlists.url,
          title: item.wishlists.title || item.wishlists.url,
          price: item.wishlists.price,
          image_url: item.wishlists.image_url,
        }));
      setDirectItems(items);
    }

    setLoading(false);
  }

  async function loadWishlistItems(kidId: string) {
    const { data } = await supabase
      .from("wishlists")
      .select("*")
      .eq("kid_id", kidId)
      .order("created_at", { ascending: false });

    setWishlistItems((data || []) as WishlistItem[]);
  }

  async function loadDirectItems() {
    if (!registry) return;

    // Load items that are directly on this registry (not from a kid's wishlist)
    const { data: itemsData } = await supabase
      .from("registry_items")
      .select("wishlist_id, wishlists(*)")
      .eq("registry_id", registry.id);

    if (itemsData) {
      const items = itemsData
        .filter((item: any) => item.wishlists && !item.wishlists.kid_id)
        .map((item: any) => ({
          id: item.wishlists.id,
          url: item.wishlists.url,
          title: item.wishlists.title || item.wishlists.url,
          price: item.wishlists.price,
          image_url: item.wishlists.image_url,
        }));
      setDirectItems(items);
    }
  }

  // Auto-scrape when URL changes
  useEffect(() => {
    const url = newItemUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      setScrapedData(null);
      return;
    }

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
          setScrapedData(data.data);
          // Auto-fill title if empty
          if (!newItemTitle && data.data.title) {
            setNewItemTitle(data.data.title);
          }
        }
      } catch (err) {
        console.error("Scrape error:", err);
      }
      setScraping(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [newItemUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddDirectItem() {
    if (!newItemUrl.trim() || !registry) {
      setError("Please enter a URL");
      return;
    }

    setAddingItem(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/login");
        return;
      }

      const url = newItemUrl.trim();

      // Create a wishlist item without a kid_id (direct registry item)
      const { data: wishlistItem, error: wishlistError } = await supabase
        .from("wishlists")
        .insert({
          user_id: session.user.id,
          kid_id: null, // No kid - direct registry item
          url,
          title: newItemTitle.trim() || scrapedData?.title || null,
          notes: newItemNotes.trim() || null,
          image_url: scrapedData?.image_url || null,
          description: scrapedData?.description || null,
          price: scrapedData?.price || null,
          currency: scrapedData?.currency || "USD",
          original_url: url,
          affiliate_url: scrapedData?.affiliate_url || null,
          retailer: scrapedData?.retailer || null,
          asin: scrapedData?.asin || null,
          status: "available",
          priority: 0,
          quantity: 1,
          quantity_claimed: 0,
          last_scraped_at: scrapedData ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (wishlistError || !wishlistItem) {
        console.error("Wishlist insert error:", JSON.stringify(wishlistError, null, 2));
        // Check for NOT NULL constraint error on kid_id
        if (wishlistError?.message?.includes("kid_id") || wishlistError?.message?.includes("not-null") || wishlistError?.message?.includes("null value")) {
          setError("Database migration required! Run the SQL in supabase/migrations/002_nullable_kid_id.sql in your Supabase dashboard to enable direct registry items.");
        } else if (!wishlistError?.message || wishlistError?.message === "" || Object.keys(wishlistError || {}).length === 0) {
          // Empty error = RLS policy blocking the insert
          setError("Permission denied. Run the SQL in supabase/migrations/002_nullable_kid_id.sql in your Supabase dashboard.");
        } else {
          setError("Failed to add item: " + (wishlistError?.message || wishlistError?.code || "Unknown error"));
        }
        return;
      }

      // Add to registry_items
      const { error: registryItemError } = await supabase
        .from("registry_items")
        .insert({
          registry_id: registry.id,
          wishlist_id: wishlistItem.id,
          display_order: directItems.length + selectedItems.length,
        });

      if (registryItemError) {
        console.error("Registry items insert error:", registryItemError);
        setError("Failed to add item to registry: " + registryItemError.message);
        return;
      }

      // Add to direct items list
      setDirectItems((prev) => [
        ...prev,
        {
          id: wishlistItem.id,
          url: wishlistItem.url,
          title: wishlistItem.title || wishlistItem.url,
          price: wishlistItem.price,
          image_url: wishlistItem.image_url,
        },
      ]);

      // Reset form
      setNewItemUrl("");
      setNewItemTitle("");
      setNewItemNotes("");
      setScrapedData(null);
      setShowAddItem(false);
    } catch (err) {
      console.error("handleAddDirectItem error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setAddingItem(false);
    }
  }

  async function removeDirectItem(itemId: string) {
    if (!registry) return;

    // Remove from registry_items
    await supabase
      .from("registry_items")
      .delete()
      .eq("registry_id", registry.id)
      .eq("wishlist_id", itemId);

    // Remove from wishlists (since it has no kid)
    await supabase.from("wishlists").delete().eq("id", itemId);

    // Update local state
    setDirectItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingCover(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "covers");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !registry) {
      setError("Registry name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/login");
        return;
      }

      // Update registry
      const { error: updateError } = await supabase
        .from("registries")
        .update({
          name: name.trim(),
          kid_id: kidId || null,
          description: description.trim() || null,
          occasion: occasion.trim() || null,
          event_date: eventDate || null,
          is_public: isPublic,
          show_prices: showPrices,
          show_purchased: showPurchased,
          allow_anonymous_claims: allowAnonymousClaims,
          cover_image_url: coverImageUrl,
        })
        .eq("id", registry.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update registry items
      // First, remove items that were deselected
      const removedItems = registryItemIds.filter((id) => !selectedItems.includes(id));
      if (removedItems.length > 0) {
        await supabase
          .from("registry_items")
          .delete()
          .eq("registry_id", registry.id)
          .in("wishlist_id", removedItems);
      }

      // Then, add new items
      const newItems = selectedItems.filter((id) => !registryItemIds.includes(id));
      if (newItems.length > 0) {
        const insertItems = newItems.map((wishlistId, index) => ({
          registry_id: registry.id,
          wishlist_id: wishlistId,
          display_order: registryItemIds.length + index,
        }));

        await supabase.from("registry_items").insert(insertItems);
      }

      router.push(`/registry/${slug}`);
    } catch (err) {
      console.error("handleSubmit error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  if (error && !registry) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="rounded-xl border border-red/20 bg-red-light px-4 py-3 text-sm text-red">
            {error}
          </div>
          <Link
            href="/registry"
            className="mt-4 inline-block rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-cream-dark transition-colors"
          >
            Back to Registries
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/kids"
          className="inline-flex items-center text-sm text-foreground/60 hover:text-red transition-colors mb-4"
        >
          &larr; Back to Kids
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Registry</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Update your registry details and items.
            </p>
          </div>
          <Link
            href={`/registry/${slug}`}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-cream-dark transition-colors"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red/20 bg-red-light px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Cover Image Upload */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <div
              className="relative h-40 bg-cream-dark cursor-pointer group"
              onClick={() => !uploadingCover && coverInputRef.current?.click()}
            >
              {coverImageUrl ? (
                <>
                  <Image
                    src={coverImageUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverImageUrl(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : null}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                {uploadingCover ? (
                  <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-foreground">Uploading...</span>
                  </div>
                ) : !coverImageUrl ? (
                  <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm text-foreground">Add cover image (optional)</span>
                  </div>
                ) : (
                  <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm text-foreground">Change cover</span>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground">Basic Info</div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Registry Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Roman's 5th Birthday"
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                For which kid?
              </label>
              <select
                value={kidId}
                onChange={(e) => setKidId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm"
              >
                <option value="">Select a kid (optional)</option>
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Occasion
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Birthday, Christmas, etc."
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a message for gift givers..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
            <div className="text-sm font-semibold text-foreground">Settings</div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Public registry</span>
                <span className="text-foreground/60"> - Anyone with the link can view</span>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Show prices</span>
                <span className="text-foreground/60"> - Display item prices to guests</span>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPurchased}
                onChange={(e) => setShowPurchased(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Show purchased items</span>
                <span className="text-foreground/60"> - Keep purchased items visible</span>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAnonymousClaims}
                onChange={(e) => setAllowAnonymousClaims(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm">
                <span className="font-medium text-foreground">Allow anonymous claims</span>
                <span className="text-foreground/60"> - Guests can claim without logging in</span>
              </span>
            </label>
          </div>

          {kidId && wishlistItems.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  Registry Items
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItems.length === wishlistItems.length) {
                      setSelectedItems([]);
                    } else {
                      setSelectedItems(wishlistItems.map((i) => i.id));
                    }
                  }}
                  className="text-xs text-red hover:underline"
                >
                  {selectedItems.length === wishlistItems.length
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {wishlistItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      selectedItems.includes(item.id)
                        ? "border-red bg-red-light"
                        : "border-border hover:bg-cream-dark"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {item.title || item.url}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {item.price && (
                          <span className="text-gold font-medium">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 border ${
                            item.status === "available"
                              ? "bg-gold-light text-gold border-gold/30"
                              : item.status === "reserved"
                              ? "bg-cream-dark text-foreground/70 border-border"
                              : "bg-card text-foreground/50 border-border"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="text-xs text-foreground/50">
                {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
              </div>
            </div>
          )}

          {kidId && wishlistItems.length === 0 && (
            <div className="rounded-2xl bg-card border border-border p-5 text-center text-sm text-foreground/60 shadow-sm">
              No wishlist items for this kid yet.{" "}
              <Link href="/kids" className="text-red hover:underline">
                Add some first
              </Link>
            </div>
          )}

          {/* Add Items Directly Section */}
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Add Items Directly</div>
                <div className="text-xs text-foreground/60 mt-0.5">
                  Add items directly to this registry without a wishlist
                </div>
              </div>
              {!showAddItem && (
                <button
                  type="button"
                  onClick={() => setShowAddItem(true)}
                  className="rounded-xl bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                >
                  + Add Item
                </button>
              )}
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <div className="rounded-xl border border-border bg-cream-dark/50 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Paste product URL (Amazon, Target, any site)
                  </label>
                  <input
                    type="url"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    placeholder="https://amazon.com/dp/..."
                    className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                  />
                </div>

                {scraping && (
                  <div className="text-sm text-foreground/50">Fetching product info...</div>
                )}

                {scrapedData && !scraping && (
                  <div className="flex gap-3 rounded-xl bg-card border border-border p-3">
                    {scrapedData.image_url && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
                        <Image
                          src={scrapedData.image_url}
                          alt={scrapedData.title || "Product"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground line-clamp-2">
                        {scrapedData.title || "No title found"}
                      </div>
                      {scrapedData.price && (
                        <div className="mt-1 text-sm font-medium text-gold">
                          ${scrapedData.price.toFixed(2)}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-foreground/50">
                        <span className="capitalize">{scrapedData.retailer}</span>
                        {scrapedData.affiliate_url && (
                          <span className="rounded bg-gold-light px-1.5 py-0.5 text-gold">
                            Affiliate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Title (optional override)
                  </label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder={scrapedData?.title || "Custom title for this item"}
                    className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Notes (optional)
                  </label>
                  <textarea
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    placeholder="Size, color, or other details..."
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItem(false);
                      setNewItemUrl("");
                      setNewItemTitle("");
                      setNewItemNotes("");
                      setScrapedData(null);
                    }}
                    className="flex-1 rounded-xl border border-border bg-card p-3 text-sm hover:bg-cream-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDirectItem}
                    disabled={addingItem || !newItemUrl.trim() || scraping}
                    className="flex-1 rounded-xl bg-red p-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
                  >
                    {addingItem ? "Adding..." : "Add to Registry"}
                  </button>
                </div>
              </div>
            )}

            {/* Direct Items List */}
            {directItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
                  Direct Items ({directItems.length})
                </div>
                {directItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    {item.image_url && (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </div>
                      {item.price && (
                        <div className="text-xs text-gold font-medium">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDirectItem(item.id)}
                      className="rounded-lg p-2 text-foreground/40 hover:text-red hover:bg-red-light transition-colors"
                      title="Remove item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/registry/${slug}`}
              className="flex-1 rounded-xl border border-border bg-card p-4 text-center text-sm hover:bg-cream-dark transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-xl bg-red p-4 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
