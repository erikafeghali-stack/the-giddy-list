"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md";
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  onFollowChange,
  size = "md",
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      window.location.href = "/login";
      return;
    }

    const currentUserId = sessionData.session.user.id;
    if (currentUserId === userId) return;

    setLoading(true);

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      setFollowing(false);
      onFollowChange?.(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });

      setFollowing(true);
      onFollowChange?.(true);
    }

    setLoading(false);
  }

  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-xl font-medium transition-colors disabled:opacity-50 ${sizeClasses} ${
        following
          ? "border border-border bg-card text-foreground hover:bg-cream-dark"
          : "bg-red text-white hover:bg-red-hover"
      }`}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
