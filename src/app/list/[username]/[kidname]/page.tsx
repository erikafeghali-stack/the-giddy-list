"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { WishlistItem, CreatorProfile } from "@/lib/types";
import Avatar from "@/components/Avatar";

type Kid = {
  id: string;
  name: string;
  birthdate: string | null;
  avatar_url: string | null;
  user_id: string;
};

interface ListData {
  kid: Kid;
  profile: CreatorProfile;
  items: WishlistItem[];
}

export default function PublicListPage({
  params,
}: {
  params: Promise<{ username: string; kidname: string }>;
}) {
  const { username, kidname } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadList() {
      setLoading(true);
      setError(null);

      // First, find the profile by username
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

      const profile = profileData as CreatorProfile;

      // Check if profile is public
      if (!profile.is_public) {
        setError("This profile is private");
        setLoading(false);
        return;
      }

      // Find the kid by slug or id
      const { data: kidData, error: kidError } = await supabase
        .from("kids")
        .select("*")
        .eq("user_id", profile.id)
        .or(`slug.eq.${kidname},id.eq.${kidname}`)
        .single();

      if (kidError || !kidData) {
        setError("Kid not found");
        setLoading(false);
        return;
      }

      const kid = kidData as Kid;

      // Load wishlist items
      const { data: itemsData } = await supabase
        .from("wishlists")
        .select("*")
        .eq("kid_id", kid.id)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      setData({
        kid,
        profile,
        items: (itemsData || []) as WishlistItem[],
      });
      setLoading(false);
    }

    loadList();
  }, [username, kidname]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Loading list...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-3xl bg-gray-50 p-12 text-center">
            <div className="text-xl font-semibold text-foreground">
              {error || "List not found"}
            </div>
            <p className="mt-2 text-foreground/50">
              This list may be private or doesn't exist.
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

  const { kid, profile, items } = data;
  const age = kid.birthdate ? calculateAge(kid.birthdate) : null;

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-light to-white">
        <div className="mx-auto max-w-5xl px-6 py-12 text-center">
          <Avatar
            src={kid.avatar_url}
            name={kid.name}
            size="xl"
            className="mx-auto w-24 h-24 ring-4 ring-white shadow-xl"
          />
          <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold text-foreground">
            {kid.name}'s Giddy List
          </h1>
          {age !== null && (
            <p className="mt-2 text-lg text-foreground/60">{age} years old</p>
          )}

          {/* Creator attribution */}
          <Link
            href={`/profile/${profile.username}`}
            className="mt-4 inline-flex items-center gap-2 text-foreground/60 hover:text-red transition-colors"
          >
            <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
            <span className="text-sm">
              by{" "}
              <span className="font-medium">
                {profile.display_name || profile.username}
              </span>
            </span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Items */}
        {items.length === 0 ? (
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
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <div className="text-xl font-semibold text-foreground">No items yet</div>
            <p className="mt-2 text-foreground/50">
              {kid.name}'s list is empty. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.affiliate_url || item.url}
                target="_blank"
                rel="noreferrer"
                className="group block"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title || "Product"}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Status badge */}
                  {item.status !== "available" && (
                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${
                          item.status === "purchased"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-400 text-yellow-900"
                        }`}
                      >
                        {item.status === "purchased" ? "Purchased" : "Reserved"}
                      </span>
                    </div>
                  )}

                  {/* Price overlay */}
                  {item.price && (
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Shop button on hover */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="block w-full rounded-full bg-red py-2.5 text-center text-sm font-medium text-white shadow-lg">
                      Shop Now
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="mt-3">
                  <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug">
                    {item.title || "Untitled"}
                  </h3>
                  {item.notes && (
                    <p className="mt-1 text-xs text-foreground/50 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
