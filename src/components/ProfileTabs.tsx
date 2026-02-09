"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collection, Registry } from "@/lib/types";
import Avatar from "./Avatar";

type Kid = {
  id: string;
  name: string;
  birthdate: string | null;
  avatar_url: string | null;
  slug: string | null;
  wishlists_count: number;
};

interface ProfileTabsProps {
  username: string;
  kids: Kid[];
  registries: (Registry & { kids?: { name: string } | null })[];
  collections: Collection[];
  isGuide: boolean;
  isOwner: boolean;
}

type TabType = "kids" | "lists" | "shortlists" | "guides";

export default function ProfileTabs({
  username,
  kids,
  registries,
  collections,
  isGuide,
  isOwner,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("kids");

  const tabs: { id: TabType; label: string; count: number; show: boolean }[] = [
    { id: "kids", label: "My Kids", count: kids.length, show: true },
    { id: "lists", label: "Giddy Wishlists", count: kids.length, show: true },
    { id: "shortlists", label: "Shortlists", count: registries.length, show: true },
    { id: "guides", label: "Giddy Guides", count: collections.length, show: isGuide },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-1 overflow-x-auto -mx-2 px-2">
          {tabs
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-red text-red"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-xs text-foreground/40">({tab.count})</span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* My Kids Tab */}
        {activeTab === "kids" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {kids.map((kid) => {
              const age = kid.birthdate ? calculateAge(kid.birthdate) : null;
              return (
                <Link
                  key={kid.id}
                  href={`/list/${username}/${kid.slug || kid.id}`}
                  className="group rounded-2xl bg-white border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <Avatar
                    src={kid.avatar_url}
                    name={kid.name}
                    size="xl"
                    className="mx-auto w-20 h-20 ring-4 ring-gray-50"
                  />
                  <div className="mt-4 font-semibold text-foreground">{kid.name}</div>
                  {age !== null && (
                    <div className="text-sm text-foreground/50">{age} years old</div>
                  )}
                  <div className="mt-2 text-xs text-red font-medium">
                    View List
                  </div>
                </Link>
              );
            })}

            {kids.length === 0 && (
              <div className="col-span-full text-center py-12 text-foreground/40">
                {isOwner ? (
                  <>
                    <p>No kids added yet</p>
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-block text-red hover:text-red-hover transition-colors"
                    >
                      Add your first kid
                    </Link>
                  </>
                ) : (
                  <p>No kids to display</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Giddy Wishlists Tab */}
        {activeTab === "lists" && (
          <div className="space-y-4">
            {kids.map((kid) => (
              <Link
                key={kid.id}
                href={`/list/${username}/${kid.slug || kid.id}`}
                className="block rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <Avatar src={kid.avatar_url} name={kid.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{kid.name}'s Giddy Wishlist</div>
                    <div className="text-sm text-foreground/50">
                      {kid.wishlists_count} items
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-foreground/30"
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
            ))}

            {kids.length === 0 && (
              <div className="text-center py-12 text-foreground/40">
                No Giddy Wishlists to display
              </div>
            )}
          </div>
        )}

        {/* Shortlists Tab */}
        {activeTab === "shortlists" && (
          <div className="grid md:grid-cols-2 gap-4">
            {registries.map((registry) => (
              <Link
                key={registry.id}
                href={`/shortlist/${registry.slug}`}
                className="block rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="font-semibold text-foreground">{registry.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground/50">
                  {registry.kids && <span>For {registry.kids.name}</span>}
                  {registry.occasion && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-foreground/60">
                      {registry.occasion}
                    </span>
                  )}
                </div>
                {registry.description && (
                  <p className="mt-2 text-sm text-foreground/50 line-clamp-2">
                    {registry.description}
                  </p>
                )}
              </Link>
            ))}

            {registries.length === 0 && (
              <div className="col-span-full text-center py-12 text-foreground/40">
                {isOwner ? (
                  <>
                    <p>No shortlists yet</p>
                    <Link
                      href="/registry/new"
                      className="mt-4 inline-block text-red hover:text-red-hover transition-colors"
                    >
                      Create your first shortlist
                    </Link>
                  </>
                ) : (
                  <p>No shortlists to display</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Giddy Guides Tab */}
        {activeTab === "guides" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/guide/${username}/${collection.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  {collection.cover_image_url ? (
                    <Image
                      src={collection.cover_image_url}
                      alt={collection.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  )}

                  {collection.age_range && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                        Ages {collection.age_range}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white line-clamp-2">
                      {collection.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-foreground/50">
                    {collection.view_count.toLocaleString()} views
                  </span>
                </div>
              </Link>
            ))}

            {collections.length === 0 && (
              <div className="col-span-full text-center py-12 text-foreground/40">
                {isOwner ? (
                  <>
                    <p>No Giddy Guides yet</p>
                    <Link
                      href="/collections/new"
                      className="mt-4 inline-block text-red hover:text-red-hover transition-colors"
                    >
                      Create your first guide
                    </Link>
                  </>
                ) : (
                  <p>No Giddy Guides to display</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
