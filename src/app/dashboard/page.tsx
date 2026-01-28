"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CreatorProfile, Collection, Registry, WishlistItem } from "@/lib/types";
import Avatar from "@/components/Avatar";

type Kid = {
  id: string;
  name: string;
  birthdate: string | null;
  avatar_url: string | null;
  slug: string | null;
};

type KidWithWishlist = Kid & {
  wishlists: WishlistItem[];
};

interface RegistryWithKid extends Registry {
  kids?: { id: string; name: string } | null;
  registry_items?: { id: string }[];
  gift_claims?: { id: string }[];
}

interface DashboardData {
  profile: CreatorProfile & { guide_enabled?: boolean; earnings_balance?: number; pending_earnings?: number };
  kids: KidWithWishlist[];
  registries: RegistryWithKid[];
  collections: Collection[];
  totalClicks?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidBirthdate, setNewKidBirthdate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      router.push("/login");
      return;
    }

    const userId = sessionData.session.user.id;

    // Load profile
    const { data: profileData } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Load kids with wishlists
    const { data: kidsData } = await supabase
      .from("kids")
      .select(`
        id,
        name,
        birthdate,
        avatar_url,
        slug,
        wishlists ( id, title, image_url, status )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    // Load registries
    const { data: registriesData } = await supabase
      .from("registries")
      .select(`
        *,
        kids ( id, name ),
        registry_items ( id ),
        gift_claims ( id )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Load collections (Giddy Guides)
    const { data: collectionsData } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("view_count", { ascending: false })
      .limit(5);

    // Load click count for guides
    let totalClicks = 0;
    if (profileData?.guide_enabled) {
      const { count } = await supabase
        .from("affiliate_clicks")
        .select("*", { count: "exact", head: true })
        .eq("guide_id", userId);
      totalClicks = count || 0;
    }

    setData({
      profile: profileData as DashboardData["profile"],
      kids: (kidsData || []).map((k: any) => ({
        ...k,
        wishlists: k.wishlists || [],
      })),
      registries: (registriesData || []) as RegistryWithKid[],
      collections: (collectionsData || []) as Collection[],
      totalClicks,
    });
    setLoading(false);
  }

  async function addKid() {
    if (!newKidName.trim()) return;

    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    // Generate slug from name
    const slug = newKidName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { error } = await supabase.from("kids").insert({
      user_id: userId,
      name: newKidName.trim(),
      birthdate: newKidBirthdate || null,
      slug,
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setNewKidName("");
    setNewKidBirthdate("");
    setShowAddKid(false);
    setSaving(false);
    await loadDashboard();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-8 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    router.push("/login");
    return null;
  }

  const { profile, kids, registries, collections, totalClicks } = data;

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="mt-2 text-lg text-foreground/50">
                Manage your kids, Giddy Lists, and Shortlists
              </p>
            </div>
            <button
              onClick={() => setShowAddKid(true)}
              className="rounded-full bg-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-hover transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Kid
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-10">
        {/* Add Kid Modal */}
        {showAddKid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
              <h2 className="text-2xl font-display font-bold text-foreground">Add a Kid</h2>
              <div className="mt-6 space-y-4">
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                  placeholder="Name (e.g., Emma)"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                  type="date"
                  value={newKidBirthdate}
                  onChange={(e) => setNewKidBirthdate(e.target.value)}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={addKid}
                  disabled={!newKidName.trim() || saving}
                  className="flex-1 rounded-full bg-red px-6 py-4 text-sm font-semibold text-white hover:bg-red-hover transition-colors disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Kid"}
                </button>
                <button
                  onClick={() => setShowAddKid(false)}
                  className="flex-1 rounded-full border border-gray-200 px-6 py-4 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MY KIDS Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-foreground">My Kids</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {kids.map((kid) => (
              <Link
                key={kid.id}
                href={`/my-kids?kid=${kid.id}`}
                className="flex-shrink-0 w-32 text-center group"
              >
                <div className="relative">
                  <Avatar
                    src={kid.avatar_url}
                    name={kid.name}
                    size="xl"
                    className="mx-auto w-20 h-20 ring-4 ring-white shadow-lg group-hover:ring-red/20 transition-all"
                  />
                  {kid.wishlists.length > 0 && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red text-white text-xs font-bold flex items-center justify-center">
                      {kid.wishlists.length}
                    </span>
                  )}
                </div>
                <div className="mt-3 font-medium text-foreground truncate text-sm">
                  {kid.name}
                </div>
                <div className="text-xs text-foreground/40">
                  {kid.wishlists.length} items
                </div>
              </Link>
            ))}

            {/* Add Kid Card */}
            <button
              onClick={() => setShowAddKid(true)}
              className="flex-shrink-0 w-32 text-center group"
            >
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center group-hover:border-red group-hover:bg-red/5 transition-all">
                <svg className="w-8 h-8 text-gray-300 group-hover:text-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="mt-3 text-sm text-foreground/40 group-hover:text-red transition-colors">
                Add Kid
              </div>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* MY GIDDY LISTS Section */}
          <section className="rounded-3xl bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-foreground">My Giddy Lists</h2>
              <Link href="/my-kids" className="text-sm text-red hover:text-red-hover transition-colors">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {kids.map((kid) => (
                <Link
                  key={kid.id}
                  href={`/my-kids?kid=${kid.id}`}
                  className="block rounded-2xl bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={kid.avatar_url} name={kid.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{kid.name}'s List</div>
                      <div className="text-sm text-foreground/50">{kid.wishlists.length} items</div>
                    </div>
                    <svg className="w-5 h-5 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}

              {kids.length === 0 && (
                <div className="text-center py-8 text-foreground/40">
                  <p>No kids yet. Add one to start building lists!</p>
                </div>
              )}
            </div>
          </section>

          {/* MY SHORTLISTS Section */}
          <section className="rounded-3xl bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-foreground">My Giddy Shortlists</h2>
              <Link href="/registry" className="text-sm text-red hover:text-red-hover transition-colors">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {registries.map((registry) => {
                const totalItems = registry.registry_items?.length || 0;
                const claimedItems = registry.gift_claims?.length || 0;

                return (
                  <Link
                    key={registry.id}
                    href={`/registry/${registry.slug}/edit`}
                    className="block rounded-2xl bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{registry.name}</div>
                        <div className="text-sm text-foreground/50">
                          {claimedItems}/{totalItems} claimed
                        </div>
                      </div>
                      {registry.occasion && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-foreground/60">
                          {registry.occasion}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {registries.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-foreground/40 mb-4">No shortlists yet</p>
                  <Link
                    href="/registry/new"
                    className="inline-block rounded-full bg-red px-5 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors"
                  >
                    Create Shortlist
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* GIDDY GUIDE EARNINGS Section (for guides only) */}
        {profile?.guide_enabled && (
          <section className="mt-8 rounded-3xl bg-gradient-to-r from-gold-light to-red-light border border-gold/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h2 className="text-lg font-display font-bold text-foreground">Giddy Guide Earnings</h2>
              </div>
              <Link href="/dashboard/earnings" className="text-sm text-red hover:text-red-hover transition-colors">
                Get Paid
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  ${((profile.earnings_balance || 0) + (profile.pending_earnings || 0)).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/50 mt-1">Total</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  ${(profile.pending_earnings || 0).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/50 mt-1">Pending</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {(totalClicks || 0).toLocaleString()}
                </div>
                <div className="text-xs text-foreground/50 mt-1">Clicks</div>
              </div>
            </div>

            {/* Top Guides */}
            {collections.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-foreground/70 mb-2">Top Guides</div>
                <div className="space-y-2">
                  {collections.slice(0, 3).map((collection, i) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="flex items-center gap-3 rounded-xl bg-white/50 p-3 hover:bg-white/80 transition-colors"
                    >
                      <span className="text-sm font-bold text-foreground/40">{i + 1}.</span>
                      <span className="flex-1 font-medium text-foreground truncate text-sm">
                        {collection.title}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {collection.view_count.toLocaleString()} views
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Become a Guide CTA (for non-guides) */}
        {!profile?.guide_enabled && (
          <section className="mt-8 rounded-3xl bg-gradient-to-r from-gold-light to-red-light border border-gold/20 p-8 text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">Become a Giddy Guide</h2>
            <p className="mt-2 text-foreground/60 max-w-md mx-auto">
              Earn money when families shop your curated gift lists. No follower minimum required.
            </p>
            <Link
              href="/dashboard/become-guide"
              className="mt-6 inline-block rounded-full bg-red px-8 py-4 text-base font-semibold text-white hover:bg-red-hover transition-colors shadow-lg shadow-red/20"
            >
              Start Earning Today
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
