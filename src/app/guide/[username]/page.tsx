import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicGuideProfile, Collection, GuideTier } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getGuideProfile(username: string): Promise<PublicGuideProfile | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data } = await supabase
    .from("creator_profiles")
    .select(
      `id, username, display_name, avatar_url, cover_image_url,
       guide_bio, guide_tier, social_instagram, social_tiktok,
       social_youtube, social_pinterest, is_featured, created_at`
    )
    .eq("username", username)
    .eq("guide_enabled", true)
    .eq("is_public", true)
    .single();

  return data as PublicGuideProfile | null;
}

async function getGuideCollections(userId: string): Promise<Collection[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (data as Collection[]) || [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const guide = await getGuideProfile(username);

  if (!guide) {
    return {
      title: "Guide Not Found | The Giddy List",
    };
  }

  const displayName = guide.display_name || guide.username;

  return {
    title: `${displayName} | Giddy Guide`,
    description: guide.guide_bio || `Shop ${displayName}'s curated picks for kids on The Giddy List.`,
    openGraph: {
      title: `${displayName} | Giddy Guide`,
      description: guide.guide_bio || `Shop ${displayName}'s curated picks for kids.`,
      images: guide.avatar_url ? [{ url: guide.avatar_url }] : undefined,
    },
  };
}

function getTierBadge(tier: GuideTier): { label: string; color: string } | null {
  const badges: Record<GuideTier, { label: string; color: string } | null> = {
    standard: null,
    curator: { label: "Curator", color: "bg-blue-100 text-blue-700" },
    influencer: { label: "Influencer", color: "bg-purple-100 text-purple-700" },
    celebrity: { label: "Celebrity", color: "bg-gold-light text-gold" },
  };
  return badges[tier];
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
      aria-label={label}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </a>
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const guide = await getGuideProfile(username);

  if (!guide) {
    notFound();
  }

  const collections = await getGuideCollections(guide.id);
  const displayName = guide.display_name || guide.username;
  const tierBadge = getTierBadge(guide.guide_tier);

  const hasSocials =
    guide.social_instagram ||
    guide.social_tiktok ||
    guide.social_youtube ||
    guide.social_pinterest;

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-red-light to-gold-light">
        {guide.cover_image_url && (
          <img
            src={guide.cover_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-cream bg-card overflow-hidden shadow-lg">
                {guide.avatar_url ? (
                  <img
                    src={guide.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-red-light text-red text-4xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {guide.is_featured && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name and Badge */}
            <div className="text-center sm:text-left sm:pb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1
                  className="text-2xl md:text-3xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                >
                  {displayName}
                </h1>
                {tierBadge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierBadge.color}`}
                  >
                    {tierBadge.label}
                  </span>
                )}
              </div>
              <p className="text-foreground/60">@{guide.username}</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {guide.guide_bio && (
          <div className="mb-8">
            <p className="text-foreground/80 max-w-2xl">{guide.guide_bio}</p>
          </div>
        )}

        {/* Social Links */}
        {hasSocials && (
          <div className="flex flex-wrap gap-4 mb-8">
            {guide.social_instagram && (
              <SocialLink
                href={`https://instagram.com/${guide.social_instagram}`}
                label={`@${guide.social_instagram}`}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                }
              />
            )}
            {guide.social_tiktok && (
              <SocialLink
                href={`https://tiktok.com/@${guide.social_tiktok}`}
                label={`@${guide.social_tiktok}`}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                }
              />
            )}
            {guide.social_youtube && (
              <SocialLink
                href={`https://youtube.com/${guide.social_youtube}`}
                label={guide.social_youtube}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                }
              />
            )}
            {guide.social_pinterest && (
              <SocialLink
                href={`https://pinterest.com/${guide.social_pinterest}`}
                label={`@${guide.social_pinterest}`}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                  </svg>
                }
              />
            )}
          </div>
        )}

        {/* Collections Section */}
        <div className="mb-10">
          <h2
            className="text-xl font-bold text-foreground mb-6"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Shop {displayName}&apos;s Picks
          </h2>

          {collections.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <p className="text-foreground/60">
                {displayName} hasn&apos;t created any collections yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] bg-cream-dark relative overflow-hidden">
                    {collection.cover_image_url ? (
                      <img
                        src={collection.cover_image_url}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-foreground/20"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-red transition-colors">
                      {collection.title}
                    </h3>
                    {collection.description && (
                      <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {collection.age_range && (
                        <span className="text-xs bg-cream-dark text-foreground/70 px-2 py-0.5 rounded-full">
                          Ages {collection.age_range}
                        </span>
                      )}
                      {collection.category && (
                        <span className="text-xs bg-cream-dark text-foreground/70 px-2 py-0.5 rounded-full capitalize">
                          {collection.category.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
