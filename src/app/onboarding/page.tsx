"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import EarnBadge from "@/components/EarnBadge";

type UserIntent = "family" | "earn" | "both";

interface IntentOption {
  value: UserIntent;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    value: "family",
    title: "For My Family",
    description: "Create wishlists and registries to share with family",
    icon: (
      <svg className="w-6 h-6 text-red" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    value: "earn",
    title: "Create & Earn",
    description: "Make gift guides and earn money from recommendations",
    icon: (
      <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    value: "both",
    title: "I want to do both!",
    description: "Family lists + create guides and earn",
    icon: (
      <div className="flex items-center gap-1">
        <svg className="w-5 h-5 text-red" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-foreground/40">+</span>
        <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.push("/login");
        return;
      }

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("onboarding_completed")
        .eq("id", data.session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  async function handleContinue() {
    if (!selectedIntent) return;

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      router.push("/login");
      return;
    }

    // Update profile with intent and mark onboarding as complete
    await supabase
      .from("creator_profiles")
      .update({
        user_intent: selectedIntent,
        onboarding_completed: true,
      })
      .eq("id", sessionData.session.user.id);

    // Route based on selection
    if (selectedIntent === "family") {
      router.push("/dashboard?add=true");
    } else if (selectedIntent === "earn") {
      router.push("/dashboard/become-guide");
    } else {
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Giddy List"
            className="h-16 w-auto mx-auto"
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground text-center mb-6">
            What would you like to do first?
          </h2>

          <div className="space-y-3">
            {INTENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIntent(option.value)}
                className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                  selectedIntent === option.value
                    ? option.value === "earn"
                      ? "border-gold bg-gold-light/20"
                      : "border-red bg-red-light"
                    : "border-border hover:bg-cream-dark"
                }`}
              >
                {/* Radio circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedIntent === option.value
                      ? option.value === "earn"
                        ? "border-gold bg-gold"
                        : "border-red bg-red"
                      : "border-border"
                  }`}
                >
                  {selectedIntent === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {option.title}
                    </span>
                    {option.value === "earn" && <EarnBadge size="sm" />}
                  </div>
                  <div className="mt-0.5 text-sm text-foreground/60 flex items-center gap-2">
                    {option.icon}
                    <span>{option.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedIntent || saving}
            className="mt-6 w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Loading..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
