"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Kid, WishlistItem } from "@/lib/types";
import { Loader2, Upload, X } from "lucide-react";

export default function NewRegistryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [kids, setKids] = useState<Kid[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (kidId) {
      loadWishlistItems(kidId);
    } else {
      setWishlistItems([]);
      setSelectedItems([]);
    }
  }, [kidId]);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: kidsData } = await supabase
      .from("kids")
      .select("id, name, birthdate")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    setKids((kidsData || []) as Kid[]);
  }

  async function loadWishlistItems(kidId: string) {
    const { data } = await supabase
      .from("wishlists")
      .select("*")
      .eq("kid_id", kidId)
      .order("created_at", { ascending: false });

    setWishlistItems((data || []) as WishlistItem[]);
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

    if (!name.trim()) {
      setError("Registry name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.push("/login");
      return;
    }

    // Create registry
    const { data: registry, error: registryError } = await supabase
      .from("registries")
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        kid_id: kidId || null,
        description: description.trim() || null,
        occasion: occasion.trim() || null,
        event_date: eventDate || null,
        is_public: isPublic,
        show_prices: showPrices,
        show_purchased: showPurchased,
        allow_anonymous_claims: allowAnonymousClaims,
        slug: generateSlug(name),
        cover_image_url: coverImageUrl,
      })
      .select()
      .single();

    if (registryError) {
      setError(registryError.message);
      setSaving(false);
      return;
    }

    // Add selected wishlist items to registry
    if (selectedItems.length > 0 && registry) {
      const registryItems = selectedItems.map((wishlistId, index) => ({
        registry_id: registry.id,
        wishlist_id: wishlistId,
        display_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("registry_items")
        .insert(registryItems);

      if (itemsError) {
        console.error("Error adding items:", itemsError);
      }
    }

    router.push(`/registry/${registry.slug}`);
  }

  function generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);

    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">New Registry</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Create a gift registry to share with family and friends.
            </p>
          </div>
          <Link
            href="/registry"
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
                  Add Items from Wishlist
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
                      {item.price && (
                        <div className="text-xs text-gold font-medium">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
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

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-red p-4 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Registry"}
          </button>
        </form>
      </div>
    </main>
  );
}
