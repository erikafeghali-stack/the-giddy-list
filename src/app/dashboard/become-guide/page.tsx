"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { estimateMonthlyEarnings, formatEarnings } from "@/lib/earnings";

export default function BecomeGuidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyGuide, setAlreadyGuide] = useState(false);
  const [estimatedViews, setEstimatedViews] = useState(1000);

  // Form state
  const [payoutEmail, setPayoutEmail] = useState("");
  const [guideBio, setGuideBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [pinterest, setPinterest] = useState("");

  useEffect(() => {
    checkGuideStatus();
  }, []);

  async function checkGuideStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("guide_enabled, payout_email")
      .eq("id", user.id)
      .single();

    if (profile?.guide_enabled) {
      setAlreadyGuide(true);
      router.push("/dashboard/earnings");
      return;
    }

    if (profile?.payout_email) {
      setPayoutEmail(profile.payout_email);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!payoutEmail || !payoutEmail.includes("@")) {
      alert("Please enter a valid PayPal email address");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        guide_enabled: true,
        guide_tier: "standard",
        payout_email: payoutEmail,
        guide_bio: guideBio || null,
        social_instagram: instagram || null,
        social_tiktok: tiktok || null,
        social_youtube: youtube || null,
        social_pinterest: pinterest || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error enabling guide:", error);
      alert("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard/earnings");
  }

  if (loading || alreadyGuide) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  const estimatedEarnings = estimateMonthlyEarnings(estimatedViews, "standard");

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Get paid to share what kids love.
          </h1>
          <p className="mt-4 text-lg text-foreground/60">
            Become a Giddy Guide and earn commission when people buy from your
            curated lists and gift guides.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-card border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center mx-auto mb-3">
                <span className="text-red font-bold text-lg">1</span>
              </div>
              <div className="font-medium text-foreground">Curate Lists</div>
              <div className="text-sm text-foreground/60 mt-1">
                Create wishlists, gift guides, and collections
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center mx-auto mb-3">
                <span className="text-red font-bold text-lg">2</span>
              </div>
              <div className="font-medium text-foreground">Share & Grow</div>
              <div className="text-sm text-foreground/60 mt-1">
                Share your profile and lists with your audience
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center mx-auto mb-3">
                <span className="text-red font-bold text-lg">3</span>
              </div>
              <div className="font-medium text-foreground">Earn Commission</div>
              <div className="text-sm text-foreground/60 mt-1">
                Get paid when people buy through your links
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Calculator */}
        <div className="rounded-2xl bg-gradient-to-r from-gold-light to-cream border border-gold/20 p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Estimate Your Earnings
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-foreground/60 mb-2">
                Estimated monthly list views
              </label>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={estimatedViews}
                onChange={(e) => setEstimatedViews(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center mt-1 font-medium text-foreground">
                {estimatedViews.toLocaleString()} views/month
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-sm text-foreground/60">
                Estimated Monthly Earnings
              </div>
              <div className="text-3xl font-bold text-red">
                {formatEarnings(estimatedEarnings)}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-foreground/50 text-center">
            Based on industry-average conversion rates. Actual earnings may vary.
          </p>
        </div>

        {/* Commission Tiers */}
        <div className="rounded-2xl bg-card border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Commission Tiers
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark/50">
              <div>
                <div className="font-medium text-foreground">Standard</div>
                <div className="text-sm text-foreground/60">
                  Starting tier for all new guides
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">50%</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark/50">
              <div>
                <div className="font-medium text-foreground">
                  Curator{" "}
                  <span className="text-xs bg-gold-light text-gold px-2 py-0.5 rounded-full ml-1">
                    Invite Only
                  </span>
                </div>
                <div className="text-sm text-foreground/60">
                  Recognized for quality curation
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">60%</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark/50">
              <div>
                <div className="font-medium text-foreground">
                  Influencer{" "}
                  <span className="text-xs bg-gold-light text-gold px-2 py-0.5 rounded-full ml-1">
                    Invite Only
                  </span>
                </div>
                <div className="text-sm text-foreground/60">
                  Top-performing guides with significant reach
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">70%</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark/50">
              <div>
                <div className="font-medium text-foreground">
                  Celebrity{" "}
                  <span className="text-xs bg-gold-light text-gold px-2 py-0.5 rounded-full ml-1">
                    Invite Only
                  </span>
                </div>
                <div className="text-sm text-foreground/60">
                  Elite partners with premium benefits
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">75%</div>
            </div>
          </div>
        </div>

        {/* Sign Up Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card border border-border p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Become a Giddy Guide
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                PayPal Email <span className="text-red">*</span>
              </label>
              <input
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-foreground"
                required
              />
              <p className="mt-1 text-xs text-foreground/50">
                This is where we'll send your earnings
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Bio
              </label>
              <textarea
                value={guideBio}
                onChange={(e) => setGuideBio(e.target.value)}
                placeholder="Tell us about yourself and what you curate..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Social Links (optional)
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram username"
                  className="w-full rounded-xl border border-border bg-card p-3 text-foreground"
                />
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="TikTok username"
                  className="w-full rounded-xl border border-border bg-card p-3 text-foreground"
                />
                <input
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="YouTube channel"
                  className="w-full rounded-xl border border-border bg-card p-3 text-foreground"
                />
                <input
                  type="text"
                  value={pinterest}
                  onChange={(e) => setPinterest(e.target.value)}
                  placeholder="Pinterest username"
                  className="w-full rounded-xl border border-border bg-card p-3 text-foreground"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-red py-4 text-white font-semibold hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {submitting ? "Setting up..." : "Become a Giddy Guide"}
          </button>

          <p className="mt-4 text-xs text-foreground/50 text-center">
            By becoming a Giddy Guide, you agree to our terms of service and
            affiliate program policies.
          </p>
        </form>
      </div>
    </main>
  );
}
