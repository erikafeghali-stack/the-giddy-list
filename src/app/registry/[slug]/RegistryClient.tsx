"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { WishlistItem, GiftClaim } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import ThankYouNoteModal from "@/components/ThankYouNoteModal";

interface RegistryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  occasion: string | null;
  event_date: string | null;
  is_public: boolean;
  show_prices: boolean;
  show_purchased: boolean;
  allow_anonymous_claims: boolean;
  cover_image_url: string | null;
  kids?: { id: string; name: string } | null;
  items: (WishlistItem & { display_order: number })[];
}

export default function RegistryClient({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [claims, setClaims] = useState<GiftClaim[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState<WishlistItem | null>(null);
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimNote, setClaimNote] = useState("");
  const [claimType, setClaimType] = useState<"reserved" | "purchased">("reserved");
  const [claiming, setClaiming] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // Thank you note state
  const [thankYouClaim, setThankYouClaim] = useState<GiftClaim | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"all" | "available" | "reserved" | "purchased">("all");

  useEffect(() => {
    loadRegistry();
  }, [slug]);

  async function loadRegistry() {
    setLoading(true);
    setError(null);

    // Try to get auth token for owner check
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/registry/${slug}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registry not found");
        setLoading(false);
        return;
      }

      setRegistry(data.registry);
      setIsOwner(data.isOwner);
      setClaims(data.claims || []);
    } catch (err) {
      setError("Failed to load registry");
    }

    setLoading(false);
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimingItem || !registry) return;

    if (!claimName.trim()) {
      alert("Please enter your name");
      return;
    }

    setClaiming(true);

    try {
      const res = await fetch(`/api/registry/${slug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlist_id: claimingItem.id,
          guest_name: claimName.trim(),
          guest_email: claimEmail.trim() || undefined,
          claim_type: claimType,
          note: claimNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to claim item");
        setClaiming(false);
        return;
      }

      // Reset form and close modal
      setClaimingItem(null);
      setClaimName("");
      setClaimEmail("");
      setClaimNote("");
      setClaimType("reserved");

      // Reload registry to show updated status
      await loadRegistry();
    } catch (err) {
      alert("Failed to claim item");
    }

    setClaiming(false);
  }

  async function copyShareLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading registry...</div>
        </div>
      </main>
    );
  }

  if (error || !registry) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">
              {error || "Registry not found"}
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              This registry may be private or no longer exists.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const availableItems = registry.items.filter((i) => i.status === "available");
  const reservedItems = registry.items.filter((i) => i.status === "reserved");
  const purchasedItems = registry.items.filter((i) => i.status === "purchased");
  const totalItems = registry.items.length;
  const claimedCount = reservedItems.length + purchasedItems.length;
  const progressPercent = totalItems > 0 ? (claimedCount / totalItems) * 100 : 0;

  // Filter items based on active tab
  const displayItems = activeTab === "all"
    ? registry.items
    : activeTab === "available"
    ? availableItems
    : activeTab === "reserved"
    ? reservedItems
    : purchasedItems;

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20 md:pb-0">
      {/* Cover Image - Taller, more impactful */}
      {registry.cover_image_url && (
        <div className="relative h-56 md:h-80 bg-gray-100">
          <Image
            src={registry.cover_image_url}
            alt={registry.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="mx-auto max-w-5xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                {registry.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-white/90">
                {registry.kids && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    For {registry.kids.name}
                  </span>
                )}
                {registry.occasion && (
                  <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                    {registry.occasion}
                  </span>
                )}
                {registry.event_date && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(registry.event_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Back link for owners */}
        {isOwner && (
          <Link
            href="/my-kids"
            className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-red transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Kids
          </Link>
        )}

        {/* Header - Only show if no cover image */}
        {!registry.cover_image_url && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {registry.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
              {registry.kids && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  For {registry.kids.name}
                </span>
              )}
              {registry.occasion && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-foreground/70">
                  {registry.occasion}
                </span>
              )}
              {registry.event_date && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(registry.event_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Bar - Clean, minimal */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {registry.description && (
              <p className="text-foreground/60 max-w-xl text-sm">
                {registry.description}
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={copyShareLink}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>
            {isOwner && (
              <Link
                href={`/registry/${registry.slug}/edit`}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Progress Bar - Cleaner, more modern */}
        {totalItems > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                Gift Progress
              </span>
              <span className="text-sm text-foreground/60">
                {claimedCount} of {totalItems} claimed
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red to-red-hover rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs - ShopMy style storefront navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "border-red text-red"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            All Items
            <span className="ml-1.5 text-xs text-foreground/40">{totalItems}</span>
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "available"
                ? "border-red text-red"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            Available
            <span className="ml-1.5 text-xs text-foreground/40">{availableItems.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("reserved")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "reserved"
                ? "border-red text-red"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            Reserved
            <span className="ml-1.5 text-xs text-foreground/40">{reservedItems.length}</span>
          </button>
          {(registry.show_purchased || isOwner) && (
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "purchased"
                  ? "border-red text-red"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              Purchased
              <span className="ml-1.5 text-xs text-foreground/40">{purchasedItems.length}</span>
            </button>
          )}
        </div>

        {/* Items Grid */}
        <div>
          <ProductGrid
            items={displayItems}
            claims={claims}
            showPrices={registry.show_prices}
            isOwner={isOwner}
            onClaimItem={(item) => setClaimingItem(item)}
            emptyMessage={activeTab === "all" ? "No items in this registry yet" : `No ${activeTab} items`}
            columns={3}
            showSearch={totalItems > 6}
          />
        </div>

        {/* Owner Claims View */}
        {isOwner && claims.length > 0 && (
          <div className="mt-8 rounded-2xl bg-card border border-border p-5 shadow-sm">
            <div className="text-sm font-semibold text-foreground mb-4">
              Who's Claiming What
            </div>
            <div className="space-y-3">
              {claims.map((claim) => {
                const item = registry.items.find((i) => i.id === claim.wishlist_id);
                return (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between rounded-xl bg-cream-dark/50 border border-border p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {item?.image_url && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.title || "Product"}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">
                          {claim.guest_name || "Anonymous"}
                        </span>
                        {claim.guest_email && (
                          <span className="text-foreground/50">
                            {" "}
                            ({claim.guest_email})
                          </span>
                        )}
                        <span className="text-foreground/60">
                          {" "}
                          {claim.claim_type === "purchased"
                            ? "purchased"
                            : "reserved"}{" "}
                          <span className="font-medium text-foreground">
                            {item?.title || "Unknown item"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setThankYouClaim(claim)}
                        className="rounded-lg bg-gold-light text-gold px-3 py-1.5 text-xs font-medium hover:bg-gold/20 transition-colors"
                      >
                        Send Thanks
                      </button>
                      <span className="text-xs text-foreground/50">
                        {new Date(claim.claimed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-start gap-4">
              {claimingItem.image_url && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                  <Image
                    src={claimingItem.image_url}
                    alt={claimingItem.title || "Product"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground">Claim Item</h2>
                <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                  {claimingItem.title || claimingItem.url}
                </p>
              </div>
            </div>

            <form onSubmit={handleClaim} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="e.g., Grandma Sue"
                  className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  We'll notify you if the registry owner sends a thank you note
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Status
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimType("reserved")}
                    className={`flex-1 rounded-xl border p-3 text-sm transition-colors ${
                      claimType === "reserved"
                        ? "border-red bg-red-light text-red"
                        : "border-border hover:bg-cream-dark"
                    }`}
                  >
                    Planning to buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimType("purchased")}
                    className={`flex-1 rounded-xl border p-3 text-sm transition-colors ${
                      claimType === "purchased"
                        ? "border-red bg-red-light text-red"
                        : "border-border hover:bg-cream-dark"
                    }`}
                  >
                    Already bought
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Note (optional)
                </label>
                <textarea
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                  placeholder="Any message for the registry owner..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimingItem(null)}
                  className="flex-1 rounded-xl border border-border bg-card p-3 text-sm hover:bg-cream-dark transition-colors"
                  disabled={claiming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red p-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
                  disabled={claiming || !claimName.trim()}
                >
                  {claiming ? "Claiming..." : "Claim Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Note Modal */}
      {thankYouClaim && registry && (
        <ThankYouNoteModal
          claim={thankYouClaim}
          item={registry.items.find((i) => i.id === thankYouClaim.wishlist_id)}
          onClose={() => setThankYouClaim(null)}
          onSent={() => {
            // Could reload to update UI if needed
          }}
        />
      )}
    </main>
  );
}
