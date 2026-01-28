"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface DashboardStats {
  totalGuides: number;
  publishedGuides: number;
  draftGuides: number;
  totalProducts: number;
  totalViews: number;
  recentLogs: Array<{
    id: string;
    topic_type: string;
    topic_params: { params: string[] };
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      // Get counts
      const [guidesResult, productsResult, logsResult] = await Promise.all([
        supabase.from("gift_guides").select("status, view_count"),
        supabase.from("products").select("id").eq("is_active", true),
        supabase
          .from("guide_generation_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const guides = guidesResult.data || [];
      const products = productsResult.data || [];
      const logs = logsResult.data || [];

      setStats({
        totalGuides: guides.length,
        publishedGuides: guides.filter((g) => g.status === "published").length,
        draftGuides: guides.filter((g) => g.status === "draft").length,
        totalProducts: products.length,
        totalViews: guides.reduce((sum, g) => sum + (g.view_count || 0), 0),
        recentLogs: logs,
      });
      setLoading(false);
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-foreground/50">Total Guides</div>
          <div className="mt-1 text-3xl font-bold text-foreground">
            {stats?.totalGuides || 0}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-foreground/50">Published</div>
          <div className="mt-1 text-3xl font-bold text-green-600">
            {stats?.publishedGuides || 0}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-foreground/50">Drafts</div>
          <div className="mt-1 text-3xl font-bold text-amber-600">
            {stats?.draftGuides || 0}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-foreground/50">Total Views</div>
          <div className="mt-1 text-3xl font-bold text-foreground">
            {stats?.totalViews.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/guides?generate=true"
              className="block w-full rounded-lg bg-red px-4 py-3 text-center text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Generate New Guide
            </Link>
            <Link
              href="/admin/products?add=true"
              className="block w-full rounded-lg bg-foreground/5 px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-foreground/10 transition-colors"
            >
              Add Product
            </Link>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-foreground mb-4">Products</h2>
          <div className="text-3xl font-bold text-foreground mb-2">
            {stats?.totalProducts || 0}
          </div>
          <p className="text-sm text-foreground/50 mb-4">Active products in database</p>
          <Link
            href="/admin/products"
            className="text-sm text-red hover:underline"
          >
            Manage Products →
          </Link>
        </div>
      </div>

      {/* Recent Generation Logs */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-foreground mb-4">
          Recent Generation Logs
        </h2>
        {stats?.recentLogs && stats.recentLogs.length > 0 ? (
          <div className="space-y-3">
            {stats.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {log.topic_type}: {log.topic_params?.params?.join(", ")}
                  </span>
                  <span className="ml-2 text-sm text-foreground/50">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : log.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/50">No generation logs yet</p>
        )}
      </div>
    </div>
  );
}
