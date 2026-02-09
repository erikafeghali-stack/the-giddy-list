"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Registry } from "@/lib/types";
import Link from "next/link";

interface RegistryWithKid extends Registry {
  kids?: { id: string; name: string } | null;
}

export default function RegistriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registries, setRegistries] = useState<RegistryWithKid[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegistries();
  }, []);

  async function loadRegistries() {
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("registries")
      .select(`
        *,
        kids ( id, name )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setRegistries(data || []);
    setLoading(false);
  }

  async function deleteRegistry(id: string, slug: string) {
    if (!confirm("Are you sure you want to delete this registry?")) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { error } = await supabase
      .from("registries")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadRegistries();
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-20 md:pb-0">
      {/* Header Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                My Giddy Registries
              </h1>
              <p className="mt-1 text-foreground/50">
                Shareable shortlists for birthdays, holidays, and special occasions
              </p>
            </div>
            <Link
              href="/registry/new"
              className="rounded-full bg-red px-5 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              New Shortlist
            </Link>
          </div>

          {/* Section Navigation - Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-gray-200">
            <Link
              href="/dashboard"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-foreground/60 hover:text-foreground transition-colors"
            >
              My Kids
            </Link>
            <Link
              href="/collections"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-foreground/60 hover:text-foreground transition-colors"
            >
              Giddy Guides
            </Link>
            <Link
              href="/registry"
              className="px-4 py-3 text-sm font-medium border-b-2 border-red text-red"
            >
              Giddy Registries
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red/20 bg-red-light px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
            <p className="mt-3 text-sm text-foreground/50">Loading shortlists...</p>
          </div>
        ) : registries.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">No shortlists yet</div>
            <p className="mt-2 text-foreground/50">
              Create your first Giddy Shortlist to share with family and friends
            </p>
            <Link
              href="/registry/new"
              className="mt-5 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Create Shortlist
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registries.map((registry) => (
              <RegistryCard
                key={registry.id}
                registry={registry}
                onDelete={() => deleteRegistry(registry.id, registry.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function RegistryCard({
  registry,
  onDelete,
}: {
  registry: RegistryWithKid;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/registry/${registry.slug}`
    : `/registry/${registry.slug}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/registry/${registry.slug}`}
            className="text-lg font-semibold text-foreground hover:text-red transition-colors"
          >
            {registry.name}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
            {registry.kids && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                For {registry.kids.name}
              </span>
            )}
            {registry.occasion && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
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

          {registry.description && (
            <p className="mt-2 text-sm text-foreground/50 line-clamp-2">
              {registry.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                registry.is_public
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-foreground/60"
              }`}
            >
              {registry.is_public ? "Public" : "Private"}
            </span>
            {registry.show_prices && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-foreground/60">
                Prices visible
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={copyLink}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? "Copied!" : "Share"}
          </button>
          <Link
            href={`/registry/${registry.slug}/edit`}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
          >
            Edit
          </Link>
          <button
            onClick={onDelete}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-red shadow-sm border border-red/20 hover:bg-red-light transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
