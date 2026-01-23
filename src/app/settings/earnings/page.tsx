"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface EarningsStats {
  totalClicks: number;
  totalCollectionViews: number;
  topCollections: {
    id: string;
    title: string;
    slug: string;
    view_count: number;
  }[];
  affiliateItems: number;
}

export default function EarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EarningsStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      // Get total collection views
      const { data: collectionsData } = await supabase
        .from("collections")
        .select("id, title, slug, view_count")
        .eq("user_id", userId)
        .order("view_count", { ascending: false })
        .limit(5);

      const totalViews = (collectionsData || []).reduce(
        (sum, c) => sum + (c.view_count || 0),
        0
      );

      // Count items with affiliate URLs
      const { count: affiliateCount } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("affiliate_url", "is", null);

      setStats({
        totalClicks: 0, // Would need a clicks tracking table
        totalCollectionViews: totalViews,
        topCollections: (collectionsData || []).map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          view_count: c.view_count || 0,
        })),
        affiliateItems: affiliateCount || 0,
      });

      setLoading(false);
    }

    loadStats();
  }, [router]);

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-4xl px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center text-sm text-foreground/60 hover:text-red transition-colors mb-2"
          >
            &larr; Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Track your affiliate performance and collection views
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-foreground/50">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="text-sm text-foreground/60">Collection Views</div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {stats?.totalCollectionViews.toLocaleString() || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="text-sm text-foreground/60">Affiliate Items</div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {stats?.affiliateItems || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="text-sm text-foreground/60">Link Clicks</div>
                <div className="mt-1 text-2xl font-bold text-gold">
                  Coming Soon
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="text-sm text-foreground/60">Est. Earnings</div>
                <div className="mt-1 text-2xl font-bold text-gold">
                  Coming Soon
                </div>
              </div>
            </div>

            {/* Top Collections */}
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Top Performing Collections
              </h2>
              {stats?.topCollections && stats.topCollections.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCollections.map((collection, index) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-cream-dark transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center text-sm font-bold text-foreground/70">
                          {index + 1}
                        </div>
                        <div className="font-medium text-foreground">
                          {collection.title}
                        </div>
                      </div>
                      <div className="text-sm text-foreground/60">
                        {collection.view_count.toLocaleString()} views
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-foreground/50">
                  No collections yet. Create your first collection to start tracking views.
                </div>
              )}
            </div>

            {/* Affiliate Info */}
            <div className="rounded-2xl bg-gold-light border border-gold/30 p-6">
              <h2 className="text-lg font-bold text-foreground mb-2">
                How Affiliate Earnings Work
              </h2>
              <div className="text-sm text-foreground/70 space-y-2">
                <p>
                  When you add products from supported retailers (like Amazon), we automatically
                  convert your links to affiliate links. When someone makes a purchase through
                  your link, you earn a commission.
                </p>
                <p>
                  <strong>Supported retailers:</strong> Amazon (up to 4% commission)
                </p>
                <p className="text-foreground/50">
                  Detailed click tracking and earnings reports coming soon.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm text-center">
              <div className="text-lg font-semibold text-foreground">
                Grow Your Earnings
              </div>
              <p className="mt-2 text-sm text-foreground/60">
                Create more collections and share them to increase your views and potential earnings.
              </p>
              <Link
                href="/collections/new"
                className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
              >
                Create New Collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
