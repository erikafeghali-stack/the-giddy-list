"use client";

import { useState, useEffect } from "react";

interface GiftSuggestion {
  title: string;
  description: string;
  estimated_price: string;
  category: string;
  search_query: string;
}

interface GuideSuggestionsProps {
  kidId?: string;
  age?: number;
  interests?: string[];
  existingItems?: string[];
  context?: "wishlist" | "registry" | "browse";
  onAddItem?: (searchQuery: string, title: string) => void;
  className?: string;
}

export default function GuideSuggestions({
  kidId,
  age,
  interests = [],
  existingItems = [],
  context = "wishlist",
  onAddItem,
  className = "",
}: GuideSuggestionsProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [kidId, age, context]);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kid_id: kidId,
          context,
          existing_items: existingItems,
          age,
          interests,
          limit: 5,
        }),
      });

      const data = await res.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setError("Failed to load suggestions");
      }
    } catch (err) {
      setError("Failed to load suggestions");
    }

    setLoading(false);
  }

  function handleSearch(suggestion: GiftSuggestion) {
    // Open Amazon search in new tab
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(suggestion.search_query)}`;
    window.open(searchUrl, "_blank");
  }

  if (loading) {
    return (
      <div className={`rounded-2xl bg-gradient-to-r from-red-light to-gold-light border border-red/10 p-6 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <div>
            <div className="font-semibold text-foreground">Finding suggestions...</div>
            <div className="text-sm text-foreground/60">Getting personalized gift ideas</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-r from-red-light to-gold-light border border-red/10 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-red" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
        <h3 className="font-semibold text-foreground">Suggested for you</h3>
        <span className="text-xs text-foreground/50 ml-auto">Powered by AI</span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="rounded-xl bg-white/70 p-4 hover:bg-white transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{suggestion.title}</div>
                <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                  {suggestion.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
                    {suggestion.estimated_price}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-foreground/60 border border-gray-200 capitalize">
                    {suggestion.category.replace("-", " ")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleSearch(suggestion)}
                className="flex-shrink-0 rounded-full bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
              >
                Find
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchSuggestions}
        className="mt-4 w-full rounded-full border border-red/20 bg-white/50 px-4 py-2.5 text-sm font-medium text-red hover:bg-white transition-colors"
      >
        Get more suggestions
      </button>
    </div>
  );
}
