"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { CreatorProfile, Collection, Registry, GiddyGuideProfile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import ProfileTabs from "@/components/ProfileTabs";

type Kid = {
  id: string;
  name: string;
  birthdate: string | null;
  avatar_url: string | null;
  slug: string | null;
  wishlists_count: number;
};

interface ProfileData extends CreatorProfile {
  kids: Kid[];
  collections: Collection[];
  registries: (Registry & { kids?: { name: string } | null })[];
  guide_enabled?: boolean;
  guide_bio?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_youtube?: string | null;
  social_pinterest?: string | null;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user?.id;

      // Load profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setError("Profile not found");
        setLoading(false);
        return;
      }

      const p = profileData as ProfileData;

      // Check if private and not owner
      if (!p.is_public && p.id !== currentUserId) {
        setError("This profile is private");
        setLoading(false);
        return;
      }

      setIsOwner(p.id === currentUserId);

      // Load kids with wishlist count
      const { data: kidsData } = await supabase
        .from("kids")
        .select(`
          id,
          name,
          birthdate,
          avatar_url,
          slug,
          wishlists ( id )
        `)
        .eq("user_id", p.id)
        .order("created_at", { ascending: true });

      const kids = (kidsData || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        birthdate: k.birthdate,
        avatar_url: k.avatar_url,
        slug: k.slug,
        wishlists_count: k.wishlists?.length || 0,
      }));

      // Load collections (Giddy Guides) - only public ones for non-owners
      const collectionsQuery = supabase
        .from("collections")
        .select("*")
        .eq("user_id", p.id)
        .order("view_count", { ascending: false });

      if (!currentUserId || p.id !== currentUserId) {
        collectionsQuery.eq("is_public", true);
      }

      const { data: collectionsData } = await collectionsQuery;

      // Load registries - only public ones for non-owners
      const registriesQuery = supabase
        .from("registries")
        .select(`*, kids ( name )`)
        .eq("user_id", p.id)
        .order("created_at", { ascending: false });

      if (!currentUserId || p.id !== currentUserId) {
        registriesQuery.eq("is_public", true);
      }

      const { data: registriesData } = await registriesQuery;

      // Check if following
      let isFollowing = false;
      if (currentUserId && currentUserId !== p.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUserId)
          .eq("following_id", p.id)
          .single();

        isFollowing = !!followData;
      }

      // Get follower/following counts
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", p.id);

      const { count: followingCnt } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", p.id);

      setProfile({
        ...p,
        kids,
        collections: (collectionsData || []) as Collection[],
        registries: registriesData || [],
      });
      setFollowing(isFollowing);
      setFollowerCount(followers || 0);
      setFollowingCount(followingCnt || 0);
      setLoading(false);
    }

    loadProfile();
  }, [username]);

  async function handleFollow() {
    if (!profile) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      window.location.href = "/login";
      return;
    }

    setFollowLoading(true);

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", sessionData.session.user.id)
        .eq("following_id", profile.id);

      setFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({
        follower_id: sessionData.session.user.id,
        following_id: profile.id,
      });

      setFollowing(true);
      setFollowerCount((c) => c + 1);
    }

    setFollowLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-3xl bg-gray-50 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">
              {error || "Profile not found"}
            </div>
            <p className="mt-2 text-foreground/50">
              This profile may be private or doesn't exist.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-full bg-red px-6 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-red-light to-gold-light">
        {profile.cover_image_url && (
          <Image
            src={profile.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-6">
        {/* Profile Header */}
        <div className="relative -mt-16 md:-mt-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-5">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name || profile.username}
                size="xl"
                className="border-4 border-white w-28 h-28 md:w-36 md:h-36 text-3xl shadow-xl"
              />
              <div className="pb-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-foreground/50">@{profile.username}</p>
              </div>
            </div>

            <div className="flex gap-3 pb-2">
              {isOwner ? (
                <>
                  <Link
                    href="/settings/profile"
                    className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </Link>
                  {profile.guide_enabled ? (
                    <Link
                      href="/dashboard/earnings"
                      className="rounded-full bg-gradient-to-r from-gold-light to-red-light border border-gold/30 px-5 py-2.5 text-sm font-medium text-foreground hover:shadow-md transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Earnings
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/become-guide"
                      className="rounded-full bg-gradient-to-r from-gold-light to-red-light border border-gold/30 px-5 py-2.5 text-sm font-medium text-foreground hover:shadow-md transition-all"
                    >
                      Become a Giddy Guide
                    </Link>
                  )}
                </>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    following
                      ? "border border-gray-200 bg-white text-foreground hover:bg-gray-50"
                      : "bg-red text-white hover:bg-red-hover"
                  }`}
                >
                  {followLoading ? "..." : following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Bio & Social */}
          <div className="mt-6">
            {(profile.bio || profile.guide_bio) && (
              <p className="text-foreground/70 max-w-xl">
                {profile.guide_bio || profile.bio}
              </p>
            )}

            {/* Social Links */}
            {(profile.social_instagram ||
              profile.social_tiktok ||
              profile.social_youtube ||
              profile.social_pinterest) && (
              <div className="mt-4 flex gap-4">
                {profile.social_instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 hover:text-foreground transition-colors"
                    title="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {profile.social_tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.social_tiktok}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 hover:text-foreground transition-colors"
                    title="TikTok"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                  </a>
                )}
                {profile.social_youtube && (
                  <a
                    href={`https://youtube.com/@${profile.social_youtube}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 hover:text-foreground transition-colors"
                    title="YouTube"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {profile.social_pinterest && (
                  <a
                    href={`https://pinterest.com/${profile.social_pinterest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 hover:text-foreground transition-colors"
                    title="Pinterest"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-foreground">{followerCount}</span>
                <span className="text-foreground/50 ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{followingCount}</span>
                <span className="text-foreground/50 ml-1">following</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{profile.collections.length}</span>
                <span className="text-foreground/50 ml-1">guides</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-10 pb-10">
          <ProfileTabs
            username={profile.username}
            kids={profile.kids}
            registries={profile.registries}
            collections={profile.collections}
            isGuide={profile.guide_enabled || false}
            isOwner={isOwner}
          />
        </div>
      </div>
    </main>
  );
}
