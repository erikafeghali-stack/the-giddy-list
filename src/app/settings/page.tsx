"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CreatorProfile } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<(CreatorProfile & { guide_enabled?: boolean }) | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const currentUser = sessionData.session.user;
      setUser({
        id: currentUser.id,
        email: currentUser.email || "",
      });

      // Load profile
      const { data: profileData } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData as CreatorProfile & { guide_enabled?: boolean });
      } else {
        setNeedsUsername(true);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  // Show username setup if needed
  if (needsUsername) {
    return <UsernameSetup userId={user?.id || ""} onComplete={() => setNeedsUsername(false)} />;
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Manage your account and preferences
        </p>

        {/* Profile Card */}
        <div className="mt-8 rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.display_name || user?.email}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">
                {profile?.display_name || "No name set"}
              </div>
              <div className="text-sm text-foreground/60 truncate">
                @{profile?.username}
              </div>
              {profile?.bio && (
                <div className="mt-1 text-sm text-foreground/70 line-clamp-2">
                  {profile.bio}
                </div>
              )}
            </div>
            <Link
              href="/settings/profile"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-cream-dark transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="mt-6 space-y-3">
          <Link
            href="/settings/profile"
            className="block rounded-2xl bg-card border border-border p-4 shadow-sm hover:bg-cream-dark/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Profile</div>
                <div className="text-sm text-foreground/60">
                  Edit your public profile, username, and bio
                </div>
              </div>
              <svg
                className="w-5 h-5 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="block rounded-2xl bg-card border border-border p-4 shadow-sm hover:bg-cream-dark/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">My Kids</div>
                <div className="text-sm text-foreground/60">
                  Manage kids, sizes, preferences, and Giddy Lists
                </div>
              </div>
              <svg
                className="w-5 h-5 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/registry"
            className="block rounded-2xl bg-card border border-border p-4 shadow-sm hover:bg-cream-dark/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Giddy Shortlists</div>
                <div className="text-sm text-foreground/60">
                  Manage your gift shortlists for events
                </div>
              </div>
              <svg
                className="w-5 h-5 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/collections"
            className="block rounded-2xl bg-card border border-border p-4 shadow-sm hover:bg-cream-dark/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">Giddy Guides</div>
                <div className="text-sm text-foreground/60">
                  Create and manage curated gift guides
                </div>
              </div>
              <svg
                className="w-5 h-5 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {profile?.guide_enabled ? (
            <Link
              href="/dashboard/earnings"
              className="block rounded-2xl bg-card border border-border p-4 shadow-sm hover:bg-cream-dark/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    Earnings
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Giddy Guide
                    </span>
                  </div>
                  <div className="text-sm text-foreground/60">
                    View your earnings, clicks, and request payouts
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ) : (
            <Link
              href="/dashboard/become-guide"
              className="block rounded-2xl bg-gradient-to-r from-gold-light to-red-light border border-gold/30 p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gold"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    Become a Giddy Guide
                  </div>
                  <div className="text-sm text-foreground/60">
                    Earn money when people shop your lists
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          )}
        </div>

        {/* Account Section */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
            Account
          </h2>
          <div className="mt-3 rounded-2xl bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Email</div>
                <div className="text-sm text-foreground/60">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl border border-red/30 bg-red-light px-4 py-3 text-sm font-medium text-red hover:bg-red/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}

function UsernameSetup({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check username availability
  useEffect(() => {
    const cleaned = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleaned.length < 3) {
      setAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("username", cleaned)
        .maybeSingle();

      setAvailable(!data);
      setChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanedUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!available) {
      setError("Username is not available");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from("creator_profiles").insert({
      id: userId,
      username: cleanedUsername,
      display_name: displayName.trim() || null,
      is_public: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    onComplete();
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Choose your username
          </h1>
          <p className="mt-2 text-foreground/60">
            This will be your public profile URL
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card border border-border p-6 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-foreground">
              Username
            </label>
            <div className="mt-2 flex rounded-xl border border-border overflow-hidden focus-within:border-red focus-within:ring-2 focus-within:ring-red/10">
              <span className="px-3 py-3 bg-cream-dark text-foreground/50 text-sm border-r border-border">
                thegiddyguide.com/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                className="flex-1 p-3 text-sm bg-transparent outline-none placeholder:text-foreground/40"
                required
              />
            </div>
            {checking && (
              <p className="mt-2 text-sm text-foreground/50">Checking...</p>
            )}
            {!checking && available === true && username.length >= 3 && (
              <p className="mt-2 text-sm text-green-600">Username available!</p>
            )}
            {!checking && available === false && (
              <p className="mt-2 text-sm text-red">Username is taken</p>
            )}
            <p className="mt-2 text-xs text-foreground/50">
              Only lowercase letters, numbers, and underscores. Min 3 characters.
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-light border border-red/20 px-4 py-3 text-sm text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !available || username.length < 3}
            className="mt-6 w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
