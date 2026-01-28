"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { GiftGuide, Product, AgeRange, CollectionCategory } from "@/lib/types";

interface GuideProduct extends Product {
  ai_description: string | null;
  highlight_reason: string | null;
  display_order: number;
}

export default function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guide, setGuide] = useState<GiftGuide | null>(null);
  const [products, setProducts] = useState<GuideProduct[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [introContent, setIntroContent] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const [category, setCategory] = useState<CollectionCategory | "">("");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    loadGuide();
  }, [id]);

  async function loadGuide() {
    setLoading(true);

    // Get guide from database
    const { data: guideData, error: guideError } = await supabase
      .from("gift_guides")
      .select("*")
      .eq("id", id)
      .single();

    if (guideError || !guideData) {
      router.push("/admin/guides");
      return;
    }

    setGuide(guideData as GiftGuide);
    setTitle(guideData.title);
    setMetaDescription(guideData.meta_description || "");
    setIntroContent(guideData.intro_content || "");
    setAgeRange(guideData.age_range || "");
    setCategory(guideData.category || "");
    setKeywords(guideData.keywords?.join(", ") || "");

    // Load products
    const { data: guideProducts } = await supabase
      .from("gift_guide_products")
      .select(`
        display_order,
        ai_description,
        highlight_reason,
        products (*)
      `)
      .eq("guide_id", id)
      .order("display_order");

    if (guideProducts) {
      const formattedProducts = guideProducts.map((gp) => ({
        ...(gp.products as unknown as Product),
        ai_description: gp.ai_description,
        highlight_reason: gp.highlight_reason,
        display_order: gp.display_order,
      }));
      setProducts(formattedProducts);
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!guide) return;

    setSaving(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await fetch(`/api/guides/${guide.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          meta_description: metaDescription,
          intro_content: introContent,
          age_range: ageRange || null,
          category: category || null,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        alert("Guide saved successfully!");
        loadGuide();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to save guide");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!guide) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const response = await fetch(`/api/guides/${guide.slug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "published" }),
    });

    if (response.ok) {
      alert("Guide published!");
      loadGuide();
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!guide) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/guides"
            className="text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            ← Back to Guides
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">Edit Guide</h1>
        </div>
        <div className="flex items-center gap-3">
          {guide.status === "draft" && (
            <button
              onClick={handlePublish}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Publish
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Meta */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-foreground mb-4">Content</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  {title.length}/60 characters (recommended for SEO)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  {metaDescription.length}/160 characters (recommended for SEO)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Introduction
                </label>
                <textarea
                  value={introContent}
                  onChange={(e) => setIntroContent(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="gift guide, kids toys, best gifts"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-foreground mb-4">
              Products ({products.length})
            </h2>

            {products.length === 0 ? (
              <p className="text-sm text-foreground/50">
                No products in this guide yet.
              </p>
            ) : (
              <div className="space-y-3">
                {products
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 flex items-center justify-center text-xs font-medium text-foreground/50 bg-white rounded">
                        {index + 1}
                      </div>
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt=""
                          className="w-12 h-12 object-contain bg-white rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">
                          {product.title}
                        </h4>
                        {product.highlight_reason && (
                          <span className="inline-block mt-1 rounded-full bg-red/10 px-2 py-0.5 text-xs text-red">
                            {product.highlight_reason}
                          </span>
                        )}
                        {product.ai_description && (
                          <p className="text-xs text-foreground/50 mt-1 line-clamp-2">
                            {product.ai_description}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {product.price ? `$${product.price}` : "—"}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-foreground mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70">Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    guide.status === "published"
                      ? "bg-green-100 text-green-700"
                      : guide.status === "draft"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {guide.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70">Views</span>
                <span className="text-sm font-medium">
                  {guide.view_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70">Created</span>
                <span className="text-sm text-foreground/70">
                  {new Date(guide.created_at).toLocaleDateString()}
                </span>
              </div>
              {guide.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Published</span>
                  <span className="text-sm text-foreground/70">
                    {new Date(guide.published_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {guide.status === "published" && (
              <a
                href={`/guides/${guide.slug}`}
                target="_blank"
                className="mt-4 block w-full rounded-lg bg-foreground/5 px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-foreground/10 transition-colors"
              >
                View Live →
              </a>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-foreground mb-4">Metadata</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Age Range
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value as AgeRange | "")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                  <option value="13-18">13-18 years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as CollectionCategory | "")
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="toys">Toys</option>
                  <option value="books">Books</option>
                  <option value="clothing">Clothing</option>
                  <option value="gear">Gear</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="arts-crafts">Arts & Crafts</option>
                  <option value="electronics">Electronics</option>
                  <option value="sports">Sports</option>
                </select>
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-foreground mb-4">URL</h2>
            <div className="text-sm text-foreground/70 break-all">
              /guides/{guide.slug}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
