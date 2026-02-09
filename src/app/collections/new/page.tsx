"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AgeRange, CollectionCategory } from "@/lib/types";
import EarningsCallout from "@/components/EarningsCallout";

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

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const [category, setCategory] = useState<CollectionCategory | "">("");
  const [isPublic, setIsPublic] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      router.push("/login");
      return;
    }

    // Generate slug from title
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8);

    const { data, error: insertError } = await supabase
      .from("collections")
      .insert({
        user_id: sessionData.session.user.id,
        title: title.trim(),
        slug,
        description: description.trim() || null,
        age_range: ageRange || null,
        category: category || null,
        is_public: isPublic,
        tags: [],
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/collections/${data.slug}`);
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-2xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/collections"
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
            <h1 className="text-2xl font-bold text-foreground">
              New Collection
            </h1>
            <p className="text-sm text-foreground/60">
              Create a gift guide to share with others
            </p>
          </div>
        </div>

        <EarningsCallout className="mb-6" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Best Toys for 3-Year-Olds"
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collection about?"
                rows={3}
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40 resize-none"
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
                  onChange={(e) =>
                    setCategory(e.target.value as CollectionCategory)
                  }
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
                    Allow others to discover and view this collection
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-light border border-red/20 px-4 py-3 text-sm text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Collection"}
          </button>
        </form>
      </div>
    </main>
  );
}
