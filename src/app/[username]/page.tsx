"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { CreatorProfile, Collection, Registry } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface ProfileData extends CreatorProfile {
  collections: Collection[];
  registries: Registry[];
  isFollowing?: boolean;
  totalFollowing?: number;
}

type FollowListType = "followers" | "following" | null;

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowList, setShowFollowList] = useState<FollowListType>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      // Get current user
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

      const p = profileData as CreatorProfile;

      // Check if private and not owner
      if (!p.is_public && p.id !== currentUserId) {
        setError("This profile is private");
        setLoading(false);
        return;
      }

      setIsOwnProfile(p.id === currentUserId);

      // Load collections
      const { data: collectionsData } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", p.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);

      // Load registries
      const { data: registriesData } = await supabase
        .from("registries")
        .select("*")
        .eq("user_id", p.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);

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

      // Get total following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", p.id);

      setProfile({
        ...p,
        collections: (collectionsData || []) as Collection[],
        registries: (registriesData || []) as Registry[],
        isFollowing,
        totalFollowing: followingCount || 0,
      });
      setFollowing(isFollowing);
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
      // Unfollow
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", sessionData.session.user.id)
        .eq("following_id", profile.id);

      setFollowing(false);
      setProfile((p) =>
        p ? { ...p, total_followers: Math.max(0, p.total_followers - 1) } : p
      );
    } else {
      // Follow
      await supabase.from("follows").insert({
        follower_id: sessionData.session.user.id,
        following_id: profile.id,
      });

      setFollowing(true);
      setProfile((p) =>
        p ? { ...p, total_followers: p.total_followers + 1 } : p
      );
    }

    setFollowLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">
              {error || "Profile not found"}
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              This profile may be private or doesn't exist.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      {/* Cover Image */}
      <div className="relative h-40 md:h-56 bg-cream-dark">
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

      <div className="mx-auto max-w-4xl px-6">
        {/* Profile Header */}
        <div className="relative -mt-12 md:-mt-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name || profile.username}
                size="xl"
                className="border-4 border-cream w-24 h-24 md:w-32 md:h-32 text-2xl md:text-3xl"
              />
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-sm text-foreground/60">@{profile.username}</p>
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-cream-dark transition-colors"
                >
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    following
                      ? "border border-border bg-card text-foreground hover:bg-cream-dark"
                      : "bg-red text-white hover:bg-red-hover"
                  }`}
                >
                  {followLoading
                    ? "..."
                    : following
                    ? "Following"
                    : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-foreground/70 max-w-xl">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <button
              onClick={() => setShowFollowList("followers")}
              className="hover:text-red transition-colors"
            >
              <span className="font-semibold text-foreground">
                {profile.total_followers}
              </span>
              <span className="text-foreground/60 ml-1">followers</span>
            </button>
            <button
              onClick={() => setShowFollowList("following")}
              className="hover:text-red transition-colors"
            >
              <span className="font-semibold text-foreground">
                {profile.totalFollowing || 0}
              </span>
              <span className="text-foreground/60 ml-1">following</span>
            </button>
            <div>
              <span className="font-semibold text-foreground">
                {profile.collections.length}
              </span>
              <span className="text-foreground/60 ml-1">collections</span>
            </div>
          </div>
        </div>

        {/* Collections Section */}
        {profile.collections.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Collections</h2>
              <Link
                href={`/${username}/collections`}
                className="text-sm text-red hover:text-red-hover transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {profile.collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/3] bg-cream-dark">
                    {collection.cover_image_url && (
                      <Image
                        src={collection.cover_image_url}
                        alt={collection.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-foreground line-clamp-1">
                      {collection.title}
                    </h3>
                    {collection.age_range && (
                      <span className="mt-1 inline-block rounded-full bg-cream-dark px-2 py-0.5 text-xs text-foreground/60">
                        Ages {collection.age_range}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Registries Section */}
        {profile.registries.length > 0 && (
          <section className="mt-10 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Registries</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {profile.registries.map((registry) => (
                <Link
                  key={registry.id}
                  href={`/registry/${registry.slug}`}
                  className="group rounded-2xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-foreground group-hover:text-red transition-colors">
                    {registry.name}
                  </h3>
                  {registry.occasion && (
                    <span className="mt-1 inline-block rounded-full bg-cream-dark px-2.5 py-0.5 text-xs text-foreground/60">
                      {registry.occasion}
                    </span>
                  )}
                  {registry.description && (
                    <p className="mt-2 text-sm text-foreground/60 line-clamp-2">
                      {registry.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {profile.collections.length === 0 && profile.registries.length === 0 && (
          <div className="mt-10 pb-10 rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">
              No public content yet
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              {isOwnProfile
                ? "Create your first collection or registry to share with others!"
                : "This creator hasn't shared any public content yet."}
            </p>
            {isOwnProfile && (
              <Link
                href="/collections/new"
                className="mt-4 inline-block rounded-xl bg-red px-5 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
              >
                Create Collection
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Follow List Modal */}
      {showFollowList && profile && (
        <FollowListModal
          userId={profile.id}
          type={showFollowList}
          onClose={() => setShowFollowList(null)}
        />
      )}
    </main>
  );
}

function FollowListModal({
  userId,
  type,
  onClose,
}: {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<CreatorProfile[]>([]);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);

      if (type === "followers") {
        // Get users who follow this profile
        const { data: followsData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);

        if (followsData && followsData.length > 0) {
          const followerIds = followsData.map((f) => f.follower_id);
          const { data: profilesData } = await supabase
            .from("creator_profiles")
            .select("*")
            .in("id", followerIds);

          setUsers((profilesData || []) as CreatorProfile[]);
        }
      } else {
        // Get users this profile follows
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map((f) => f.following_id);
          const { data: profilesData } = await supabase
            .from("creator_profiles")
            .select("*")
            .in("id", followingIds);

          setUsers((profilesData || []) as CreatorProfile[]);
        }
      }

      setLoading(false);
    }

    loadUsers();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-card shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground capitalize">{type}</h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-sm text-foreground/50 text-center py-4">
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-foreground/50 text-center py-4">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-cream-dark transition-colors"
                >
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name || user.username}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">
                      {user.display_name || user.username}
                    </div>
                    <div className="text-xs text-foreground/50">
                      @{user.username}
                    </div>
                  </div>
                  <div className="text-xs text-foreground/50">
                    {user.total_followers} followers
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
