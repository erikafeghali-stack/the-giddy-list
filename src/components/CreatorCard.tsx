"use client";

import Link from "next/link";
import { CreatorProfile } from "@/lib/types";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

interface CreatorCardProps {
  creator: CreatorProfile;
  isFollowing?: boolean;
  showFollowButton?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function CreatorCard({
  creator,
  isFollowing = false,
  showFollowButton = false,
  onFollowChange,
}: CreatorCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-all">
      <Link
        href={`/${creator.username}`}
        className="flex items-center gap-3 group"
      >
        <Avatar
          src={creator.avatar_url}
          name={creator.display_name || creator.username}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground group-hover:text-red transition-colors truncate">
            {creator.display_name || creator.username}
          </div>
          <div className="text-xs text-foreground/50 truncate">
            @{creator.username}
          </div>
          <div className="mt-1 text-xs text-foreground/60">
            {creator.total_followers} followers
          </div>
        </div>
      </Link>

      {creator.bio && (
        <p className="mt-3 text-sm text-foreground/70 line-clamp-2">
          {creator.bio}
        </p>
      )}

      {showFollowButton && (
        <div className="mt-3">
          <FollowButton
            userId={creator.id}
            initialFollowing={isFollowing}
            onFollowChange={onFollowChange}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
