"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { EarningsTransaction, GiddyGuideProfile } from "@/lib/types";
import {
  formatEarnings,
  canRequestPayout,
  MINIMUM_PAYOUT,
  getTierInfo,
} from "@/lib/earnings";
import Link from "next/link";

export default function EarningsDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GiddyGuideProfile | null>(null);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    thisMonthClicks: 0,
    conversions: 0,
  });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, []);

  async function loadEarningsData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Load guide profile
    const { data: profileData } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData as GiddyGuideProfile);
      setPayoutEmail(profileData.payout_email || "");
    }

    // Load transactions
    const { data: transactionsData } = await supabase
      .from("earnings_transactions")
      .select("*")
      .eq("guide_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (transactionsData) {
      setTransactions(transactionsData);
    }

    // Load click stats
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: totalClicks } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("guide_id", user.id);

    const { count: thisMonthClicks } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("guide_id", user.id)
      .gte("created_at", firstOfMonth.toISOString());

    const { count: conversions } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("guide_id", user.id)
      .eq("converted", true);

    setStats({
      totalClicks: totalClicks || 0,
      thisMonthClicks: thisMonthClicks || 0,
      conversions: conversions || 0,
    });

    setLoading(false);
  }

  async function handleRequestPayout() {
    if (!profile) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < MINIMUM_PAYOUT) {
      alert(`Minimum payout is ${formatEarnings(MINIMUM_PAYOUT)}`);
      return;
    }

    if (amount > profile.earnings_balance) {
      alert("Amount exceeds available balance");
      return;
    }

    if (!payoutEmail || !payoutEmail.includes("@")) {
      alert("Please enter a valid PayPal email");
      return;
    }

    setRequesting(true);

    const { error } = await supabase.from("payout_requests").insert({
      guide_id: profile.id,
      amount: amount,
      payout_email: payoutEmail,
    });

    if (error) {
      alert("Failed to submit payout request. Please try again.");
      setRequesting(false);
      return;
    }

    // Update payout email if changed
    if (payoutEmail !== profile.payout_email) {
      await supabase
        .from("creator_profiles")
        .update({ payout_email: payoutEmail })
        .eq("id", profile.id);
    }

    alert("Payout request submitted! You'll receive payment within 5-7 business days.");
    setShowPayoutModal(false);
    setPayoutAmount("");
    loadEarningsData();
    setRequesting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  if (!profile?.guide_enabled) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl bg-card border border-border p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Become a Giddy Guide
            </h1>
            <p className="mt-2 text-foreground/60">
              Start earning by sharing what kids love.
            </p>
            <Link
              href="/dashboard/become-guide"
              className="mt-6 inline-block rounded-xl bg-red px-6 py-3 text-white font-medium hover:bg-red-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tierInfo = getTierInfo(profile.guide_tier);
  const canPayout = canRequestPayout(profile.earnings_balance);

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-foreground/60">Giddy Guide</span>
            {tierInfo.badge && (
              <span className="rounded-full bg-gold-light text-gold px-2 py-0.5 text-xs font-medium">
                {tierInfo.badge}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-sm text-foreground/60">Total Earned</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {formatEarnings(profile.total_earnings)}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-sm text-foreground/60">Pending</div>
            <div className="mt-1 text-2xl font-bold text-foreground/70">
              {formatEarnings(profile.pending_earnings)}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-sm text-foreground/60">Available</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {formatEarnings(profile.earnings_balance)}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="text-sm text-foreground/60">This Month Clicks</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {stats.thisMonthClicks.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payout Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={!canPayout}
            className={`rounded-xl px-6 py-3 font-medium transition-colors ${
              canPayout
                ? "bg-red text-white hover:bg-red-hover"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Get Paid
          </button>
          {!canPayout && (
            <p className="mt-2 text-sm text-foreground/50">
              Minimum {formatEarnings(MINIMUM_PAYOUT)} required to withdraw
            </p>
          )}
        </div>

        {/* Commission Rate */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-gold-light to-cream border border-gold/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground/70">
                Your Commission Rate
              </div>
              <div className="mt-1 text-3xl font-bold text-foreground">
                {profile.guide_tier === "standard"
                  ? "50%"
                  : profile.guide_tier === "curator"
                  ? "60%"
                  : profile.guide_tier === "influencer"
                  ? "70%"
                  : "75%"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-foreground/60">
                {tierInfo.name} Tier
              </div>
              <div className="text-xs text-foreground/50 mt-1">
                {tierInfo.description}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-foreground/50">
              No transactions yet. Start sharing your lists to earn!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {tx.product_title || "Product Purchase"}
                    </div>
                    <div className="text-xs text-foreground/50 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} &middot;{" "}
                      {tx.source_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        tx.status === "confirmed"
                          ? "text-green-600"
                          : tx.status === "paid"
                          ? "text-foreground"
                          : "text-foreground/50"
                      }`}
                    >
                      +{formatEarnings(tx.guide_share)}
                    </div>
                    <div className="text-xs text-foreground/50 capitalize">
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="mt-8 rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Performance</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm text-foreground/60">Total Clicks</div>
              <div className="text-xl font-bold text-foreground">
                {stats.totalClicks.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/60">Conversions</div>
              <div className="text-xl font-bold text-foreground">
                {stats.conversions.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-foreground/60">Conversion Rate</div>
              <div className="text-xl font-bold text-foreground">
                {stats.totalClicks > 0
                  ? ((stats.conversions / stats.totalClicks) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground">Request Payout</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Available: {formatEarnings(profile.earnings_balance)}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Amount
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`Min ${formatEarnings(MINIMUM_PAYOUT)}`}
                  className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-foreground"
                  min={MINIMUM_PAYOUT}
                  max={profile.earnings_balance}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-foreground"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 rounded-xl border border-border bg-card p-3 text-foreground hover:bg-cream-dark transition-colors"
                disabled={requesting}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="flex-1 rounded-xl bg-red p-3 text-white font-medium hover:bg-red-hover transition-colors disabled:opacity-50"
                disabled={requesting}
              >
                {requesting ? "Submitting..." : "Request Payout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
