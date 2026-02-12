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
    <main className="min-h-screen bg-[var(--background)] pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="section-container py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="heading-lg">
                Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1.5 subheading">
                Manage your kids, wishlists, and registries
              </p>
            </div>
            <button
              onClick={() => setShowAddKid(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Kid
            </button>
          </div>
        </div>
      </div>

      <div className="section-container py-8">
        {/* Add Kid Modal */}
        {showAddKid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <h2 className="heading-md">Add a Kid</h2>
              <p className="mt-1 text-sm text-foreground/60">Name and optional birthday.</p>
              <div className="mt-5 space-y-3">
                <input
                  className="input-premium"
                  placeholder="Name (e.g., Emma)"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                />
                <input
                  className="input-premium"
                  type="date"
                  value={newKidBirthdate}
                  onChange={(e) => setNewKidBirthdate(e.target.value)}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={addKid}
                  disabled={!newKidName.trim() || saving}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Kid"}
                </button>
                <button
                  onClick={() => setShowAddKid(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Kids */}
        <section className="mb-10 relative z-10">
          <h2 className="label-uppercase mb-4">My Kids</h2>
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {kids.map((kid) => (
              <a
                key={kid.id}
                href={`/my-kids?kid=${encodeURIComponent(kid.id)}`}
                className="flex-shrink-0 w-28 text-center group block cursor-pointer no-underline text-inherit relative z-10"
              >
                <div className="relative inline-block">
                  <Avatar
                    src={kid.avatar_url}
                    name={kid.name}
                    size="xl"
                    className="mx-auto w-16 h-16 ring-2 ring-white shadow-md group-hover:ring-red/30 transition-all pointer-events-none rounded-full"
                  />
                  {kid.wishlists.length > 0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-red text-white text-xs font-semibold flex items-center justify-center pointer-events-none">
                      {kid.wishlists.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 font-medium text-foreground truncate text-sm">
                  {kid.name}
                </div>
                <div className="text-xs text-foreground/50">
                  {kid.wishlists.length} items
                </div>
              </a>
            ))}
            <button
              onClick={() => setShowAddKid(true)}
              className="flex-shrink-0 w-28 text-center group"
            >
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center group-hover:border-red/50 group-hover:bg-red/5 transition-all">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="mt-2 text-xs text-foreground/50 group-hover:text-red transition-colors">
                Add Kid
              </div>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* My Giddy Wishlists */}
          <section className="card-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-md text-base">My Giddy Wishlists</h2>
              <Link href="/my-kids" className="text-sm font-medium text-red hover:text-red-hover transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {kids.map((kid) => {
                const listHref = profile?.username
                  ? `/list/${profile.username}/${kid.slug || kid.id}`
                  : `/my-kids?kid=${kid.id}`;
                return (
                  <div key={kid.id} className="rounded-xl border border-gray-100 bg-white p-3.5 hover:border-gray-200 transition-colors">
                    <Link href={`/my-kids?kid=${kid.id}`} className="flex items-center gap-3">
                      <Avatar src={kid.avatar_url} name={kid.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{kid.name}'s List</div>
                        <div className="text-sm text-foreground/50">{kid.wishlists.length} items</div>
                      </div>
                      <svg className="w-5 h-5 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    {profile?.username && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <a
                          href={listHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-red hover:text-red-hover transition-colors"
                        >
                          View shareable list →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
              {kids.length === 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 py-8 text-center text-sm text-foreground/50">
                  No kids yet. Add one above to start building lists.
                </div>
              )}
            </div>
          </section>

          {/* My Giddy Registries */}
          <section className="card-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-md text-base">My Giddy Registries</h2>
              <Link href="/registry" className="text-sm font-medium text-red hover:text-red-hover transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {registries.map((registry) => {
                const totalItems = registry.registry_items?.length || 0;
                const claimedItems = registry.gift_claims?.length || 0;

                return (
                  <Link
                    key={registry.id}
                    href={`/registry/${registry.slug}/edit`}
                    className="block rounded-xl border border-gray-100 bg-white p-3.5 hover:border-gray-200 transition-colors"
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
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 py-8 text-center">
                  <p className="text-sm text-foreground/50 mb-3">No registries yet</p>
                  <Link href="/registry/new" className="btn-primary text-sm inline-block">
                    Create registry
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Giddy Guide Earnings (for guides only) */}
        {profile?.guide_enabled && (
          <section className="mt-8 card-premium p-5 bg-gradient-to-br from-gold-light/40 to-red-light/30 border-gold/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-md text-base">Giddy Guide Earnings</h2>
              <Link href="/dashboard/earnings" className="text-sm font-medium text-red hover:text-red-hover transition-colors">
                Get paid
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/80 border border-gray-100 p-3.5 text-center">
                <div className="text-xl font-bold text-foreground">
                  ${((profile.earnings_balance || 0) + (profile.pending_earnings || 0)).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/50 mt-0.5">Total</div>
              </div>
              <div className="rounded-xl bg-white/80 border border-gray-100 p-3.5 text-center">
                <div className="text-xl font-bold text-foreground">
                  ${(profile.pending_earnings || 0).toFixed(2)}
                </div>
                <div className="text-xs text-foreground/50 mt-0.5">Pending</div>
              </div>
              <div className="rounded-xl bg-white/80 border border-gray-100 p-3.5 text-center">
                <div className="text-xl font-bold text-foreground">
                  {(totalClicks || 0).toLocaleString()}
                </div>
                <div className="text-xs text-foreground/50 mt-0.5">Clicks</div>
              </div>
            </div>
            {collections.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-foreground/60 mb-2 uppercase tracking-wider">Top guides</div>
                <div className="space-y-1.5">
                  {collections.slice(0, 3).map((collection, i) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="flex items-center gap-3 rounded-lg bg-white/70 border border-gray-100 px-3 py-2.5 hover:bg-white transition-colors"
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
          <section className="mt-8 card-premium p-6 text-center bg-gradient-to-br from-gold-light/30 to-red-light/20">
            <h2 className="heading-md">Become a Giddy Guide</h2>
            <p className="mt-2 text-sm text-foreground/60 max-w-sm mx-auto">
              Earn when families shop your curated gift lists. No follower minimum.
            </p>
            <Link href="/dashboard/become-guide" className="mt-5 btn-primary inline-block">
              Start earning
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
