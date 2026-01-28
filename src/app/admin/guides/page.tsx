"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { GiftGuide, GuideStatus, GuideTopicType } from "@/lib/types";

interface GuideWithCount extends GiftGuide {
  product_count: number;
}

export default function AdminGuidesPage() {
  const searchParams = useSearchParams();
  const showGenerate = searchParams.get("generate") === "true";

  const [guides, setGuides] = useState<GuideWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | GuideStatus>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(showGenerate);
  const [generating, setGenerating] = useState(false);

  // Generate form state
  const [topicType, setTopicType] = useState<GuideTopicType>("age");
  const [topicParams, setTopicParams] = useState<string[]>([]);

  useEffect(() => {
    loadGuides();
  }, [filter]);

  async function loadGuides() {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const params = new URLSearchParams();
    if (filter !== "all") {
      params.set("status", filter);
    }
    params.set("include_all", "true");
    params.set("limit", "100");

    const response = await fetch(`/api/guides?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setGuides(data.guides || []);
    setLoading(false);
  }

  async function handleGenerate() {
    if (topicParams.length === 0) {
      alert("Please select at least one parameter");
      return;
    }

    setGenerating(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await fetch("/api/guides/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic_type: topicType,
          topic_params: topicParams,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Guide generated successfully!`);
        setShowGenerateModal(false);
        loadGuides();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to generate guide");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(guideId: string) {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const guide = guides.find((g) => g.id === guideId);
    if (!guide) return;

    const response = await fetch(`/api/guides/${guide.slug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "published" }),
    });

    if (response.ok) {
      loadGuides();
    }
  }

  async function handleArchive(guideId: string) {
    if (!confirm("Are you sure you want to archive this guide?")) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const guide = guides.find((g) => g.id === guideId);
    if (!guide) return;

    const response = await fetch(`/api/guides/${guide.slug}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      loadGuides();
    }
  }

  const topicOptions: Record<GuideTopicType, string[]> = {
    age: ["0-2", "3-5", "6-8", "9-12", "13-18"],
    category: [
      "toys",
      "books",
      "clothing",
      "gear",
      "outdoor",
      "arts-crafts",
      "electronics",
      "sports",
    ],
    occasion: ["birthday", "christmas", "hanukkah", "back-to-school", "graduation"],
    seasonal: ["winter-holidays", "spring", "summer", "back-to-school", "fall"],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gift Guides</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
        >
          Generate New Guide
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "published", "draft", "archived"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? "bg-foreground text-white"
                : "bg-white text-foreground/70 hover:bg-gray-100"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Guides List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
        </div>
      ) : guides.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center border border-gray-100">
          <p className="text-foreground/50">No guides found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
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
                    {guide.age_range && (
                      <span className="text-xs text-foreground/50">
                        Ages {guide.age_range}
                      </span>
                    )}
                    {guide.category && (
                      <span className="text-xs text-foreground/50 capitalize">
                        {guide.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground">{guide.title}</h3>
                  <p className="text-sm text-foreground/50 mt-1 line-clamp-1">
                    {guide.meta_description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-foreground/40">
                    <span>{guide.product_count} products</span>
                    <span>{guide.view_count.toLocaleString()} views</span>
                    <span>
                      {new Date(guide.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {guide.status === "draft" && (
                    <button
                      onClick={() => handlePublish(guide.id)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                  <Link
                    href={`/admin/guides/${guide.id}`}
                    className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/10 transition-colors"
                  >
                    Edit
                  </Link>
                  {guide.status === "published" && (
                    <a
                      href={`/guides/${guide.slug}`}
                      target="_blank"
                      className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleArchive(guide.id)}
                    className="rounded-lg bg-red/10 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/20 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Generate New Guide
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Topic Type
                </label>
                <select
                  value={topicType}
                  onChange={(e) => {
                    setTopicType(e.target.value as GuideTopicType);
                    setTopicParams([]);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="age">Age Range</option>
                  <option value="category">Category</option>
                  <option value="occasion">Occasion</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Parameters (select one or more)
                </label>
                <div className="flex flex-wrap gap-2">
                  {topicOptions[topicType].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTopicParams((prev) =>
                          prev.includes(option)
                            ? prev.filter((p) => p !== option)
                            : [...prev, option]
                        );
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        topicParams.includes(option)
                          ? "bg-red text-white"
                          : "bg-gray-100 text-foreground/70 hover:bg-gray-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || topicParams.length === 0}
                className="flex-1 rounded-lg bg-red px-4 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
