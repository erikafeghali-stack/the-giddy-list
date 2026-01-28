"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Collection, CreatorProfile, TrendingGift, AgeRange, PublicGuideProfile, GuideTier } from "@/lib/types";
import Avatar from "@/components/Avatar";
import ProductImage from "@/components/ProductImage";
import AnimatedImageGrid from "@/components/AnimatedImageGrid";
import { Gamepad2, Shirt, BookOpen, Baby, Bed, TreePine, Palette, Laptop } from "lucide-react";

// Age categories configuration
const AGE_CATEGORIES: { range: AgeRange; label: string; description: string; image: string }[] = [
  { range: "0-2", label: "Baby & Toddler", description: "First toys, teethers & nursery", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop" },
  { range: "3-5", label: "Preschool", description: "Creative play & learning", image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop" },
  { range: "6-8", label: "Early Elementary", description: "Building sets & books", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=400&fit=crop" },
  { range: "9-12", label: "Tweens", description: "Tech & hobbies", image: "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=400&h=400&fit=crop" },
  { range: "13-18", label: "Teens", description: "Fashion & experiences", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=400&fit=crop" },
];

// Sample collections for when database is empty
const SAMPLE_COLLECTIONS = [
  {
    id: "1",
    slug: "best-toys-toddlers",
    title: "Best Toys for Toddlers 2024",
    cover_image_url: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=750&fit=crop",
    age_range: "0-2",
    view_count: 12500,
    creator_profiles: {
      display_name: "Sarah Mitchell",
      username: "sarahm",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    },
  },
  {
    id: "2",
    slug: "holiday-gift-guide-kids",
    title: "Holiday Gift Guide for Kids",
    cover_image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&h=750&fit=crop",
    age_range: "3-5",
    view_count: 8700,
    creator_profiles: {
      display_name: "Jessica Kim",
      username: "jessicak",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
  },
  {
    id: "3",
    slug: "stem-toys-curious-kids",
    title: "STEM Toys for Curious Kids",
    cover_image_url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=750&fit=crop",
    age_range: "6-8",
    view_count: 6300,
    creator_profiles: {
      display_name: "Emily Roberts",
      username: "emilyr",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    },
  },
];

// Sample creators for when database is empty (using Unsplash portraits)
const SAMPLE_CREATORS = [
  { id: "1", username: "sarahm", display_name: "Sarah Mitchell", total_followers: 12400, avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" },
  { id: "2", username: "jessicak", display_name: "Jessica Kim", total_followers: 8700, avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" },
  { id: "3", username: "emilyr", display_name: "Emily Roberts", total_followers: 15200, avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face" },
  { id: "4", username: "amandaj", display_name: "Amanda Johnson", total_followers: 6300, avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face" },
  { id: "5", username: "laurenb", display_name: "Lauren Brown", total_followers: 9100, avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face" },
  { id: "6", username: "meganw", display_name: "Megan Williams", total_followers: 11800, avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face" },
  { id: "7", username: "rachelg", display_name: "Rachel Garcia", total_followers: 7500, avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face" },
  { id: "8", username: "ashleyt", display_name: "Ashley Taylor", total_followers: 13600, avatar_url: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face" },
];

// Sample featured Giddy Guides for when database is empty
const SAMPLE_GUIDES: (PublicGuideProfile & { collections_count?: number })[] = [
  {
    id: "1",
    username: "momofthree",
    display_name: "Sarah Mitchell",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    cover_image_url: null,
    guide_bio: "Mom of 3. Sharing the toys and gear that actually last.",
    guide_tier: "influencer" as GuideTier,
    social_instagram: "sarahmitchell",
    social_tiktok: null,
    social_youtube: null,
    social_pinterest: null,
    is_featured: true,
    created_at: new Date().toISOString(),
    collections_count: 12,
  },
  {
    id: "2",
    username: "playtimecurator",
    display_name: "Jessica Kim",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    cover_image_url: null,
    guide_bio: "Preschool teacher turned gift expert. Kid-tested, parent-approved.",
    guide_tier: "curator" as GuideTier,
    social_instagram: "playtimecurator",
    social_tiktok: "playtimecurator",
    social_youtube: null,
    social_pinterest: null,
    is_featured: true,
    created_at: new Date().toISOString(),
    collections_count: 8,
  },
  {
    id: "3",
    username: "stemqueen",
    display_name: "Emily Roberts",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    cover_image_url: null,
    guide_bio: "Engineer mom on a mission to make STEM fun for every kid.",
    guide_tier: "curator" as GuideTier,
    social_instagram: "stemqueen",
    social_tiktok: null,
    social_youtube: "STEMQueenKids",
    social_pinterest: null,
    is_featured: true,
    created_at: new Date().toISOString(),
    collections_count: 15,
  },
  {
    id: "4",
    username: "outdoorfamily",
    display_name: "Amanda Johnson",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    cover_image_url: null,
    guide_bio: "Adventure-loving family sharing outdoor gear for every age.",
    guide_tier: "standard" as GuideTier,
    social_instagram: "outdoorfamily",
    social_tiktok: null,
    social_youtube: null,
    social_pinterest: "outdoorfamily",
    is_featured: true,
    created_at: new Date().toISOString(),
    collections_count: 6,
  },
];

// FAQ data
const FAQ_ITEMS = [
  {
    question: "How does The Giddy List work?",
    answer: "Create a free account, add your kids with their ages and sizes, then build Giddy Lists by pasting product URLs from any store. Share your unique link with family and friends — they can see exactly what your kids want and mark items as purchased."
  },
  {
    question: "How do I earn money?",
    answer: "When someone purchases a gift through your list, you earn a commission on eligible items. Earnings are tracked automatically and paid out monthly. The more you share, the more you earn — whether you have 5 followers or 5 million."
  },
  {
    question: "Can I add items from any store?",
    answer: "Yes! Paste product URLs from Amazon, Target, Walmart, boutique shops, or anywhere else. Our system automatically pulls in product details, images, and pricing. If a store isn't supported yet, you can manually add items."
  },
  {
    question: "Is this different from a baby registry?",
    answer: "The Giddy List works for kids of ALL ages (0-18), not just babies. It's a running Giddy List that grows with your kids, plus you can create event-specific Giddy Shortlists for birthdays, holidays, or any occasion."
  },
  {
    question: "How do gift givers use the list?",
    answer: "Gift givers can browse your list without creating an account. They click on items to purchase directly from the retailer, then mark them as bought so others don't duplicate gifts. They can also see current sizes and interests."
  },
];

interface CollectionWithCreator extends Collection {
  creator_profiles: CreatorProfile;
}

// FAQ Accordion Component
function FAQAccordion({ items }: { items: typeof FAQ_ITEMS }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item, index) => (
        <div key={index} className="py-6">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between text-left group"
          >
            <span className="text-lg md:text-xl font-semibold text-foreground group-hover:text-red transition-colors pr-8">
              {item.question}
            </span>
            <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-200 ${openIndex === index ? 'bg-red text-white rotate-180' : 'text-foreground/50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 mt-4' : 'max-h-0'}`}>
            <p className="text-foreground/60 leading-relaxed pr-12">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [featuredCollections, setFeaturedCollections] = useState<CollectionWithCreator[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<CreatorProfile[]>([]);
  const [featuredGuides, setFeaturedGuides] = useState<(PublicGuideProfile & { collections_count?: number })[]>([]);
  const [trendingGifts, setTrendingGifts] = useState<Record<AgeRange, TrendingGift[]>>({
    '0-2': [], '3-5': [], '6-8': [], '9-12': [], '13-18': [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      const { data: collectionsData } = await supabase
        .from("collections")
        .select("*, creator_profiles(*)")
        .eq("is_public", true)
        .order("view_count", { ascending: false })
        .limit(6);

      const { data: creatorsData } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("is_public", true)
        .order("total_followers", { ascending: false })
        .limit(12);

      // Fetch featured Giddy Guides
      const { data: guidesData } = await supabase
        .from("creator_profiles")
        .select("id, username, display_name, avatar_url, cover_image_url, guide_bio, guide_tier, social_instagram, social_tiktok, social_youtube, social_pinterest, is_featured, created_at")
        .eq("guide_enabled", true)
        .eq("is_featured", true)
        .eq("is_public", true)
        .limit(4);

      if (guidesData && guidesData.length > 0) {
        // Get collection counts for each guide
        const guidesWithCounts = await Promise.all(
          guidesData.map(async (guide) => {
            const { count } = await supabase
              .from("collections")
              .select("*", { count: "exact", head: true })
              .eq("user_id", guide.id)
              .eq("is_public", true);
            return { ...guide, collections_count: count || 0 } as PublicGuideProfile & { collections_count?: number };
          })
        );
        setFeaturedGuides(guidesWithCounts);
      }

      const ageRanges: AgeRange[] = ['0-2', '3-5', '6-8', '9-12', '13-18'];
      const giftsData: Record<AgeRange, TrendingGift[]> = {
        '0-2': [], '3-5': [], '6-8': [], '9-12': [], '13-18': [],
      };

      await Promise.all(
        ageRanges.map(async (range) => {
          try {
            const res = await fetch(`/api/trending-gifts?age_range=${range}&limit=4`);
            const data = await res.json();
            if (data.success && data.data) {
              giftsData[range] = data.data;
            }
          } catch (err) {
            console.error(`Failed to fetch trending gifts for ${range}:`, err);
          }
        })
      );

      setTrendingGifts(giftsData);
      setFeaturedCollections((collectionsData || []) as CollectionWithCreator[]);
      setFeaturedCreators((creatorsData || []) as CreatorProfile[]);
      setLoading(false);
    }

    loadFeatured();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* ===== HERO SECTION - Full Bleed Immersive ===== */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] md:max-h-[1000px] overflow-hidden">
        {/* Animated Image Grid Background */}
        <AnimatedImageGrid variant="hero" />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/35 md:bg-black/30" />

        {/* Centered Text Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight leading-[0.9]"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              textShadow: "0 4px 30px rgba(0,0,0,0.3)",
            }}
          >
            Gifts that make<br className="hidden sm:block" /> them giddy.
          </h1>

          <p
            className="mt-6 md:mt-8 text-base md:text-lg lg:text-xl text-white/80 max-w-xl leading-relaxed"
            style={{ textShadow: "0 2px 15px rgba(0,0,0,0.3)" }}
          >
            Curated gift lists for kids 0-18. Discover what they really want — or create your own.
          </p>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Button container with subtle backdrop for contrast */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-2 rounded-full">
              <Link
                href="/discover"
                className="w-full sm:w-auto rounded-full bg-red px-10 py-4 md:px-12 md:py-5 text-base md:text-lg font-semibold text-white hover:bg-red-hover transition-all duration-200 hover:scale-[1.02] shadow-2xl"
              >
                Discover Lists
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-full bg-white px-10 py-4 md:px-12 md:py-5 text-base md:text-lg font-semibold text-red hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] shadow-2xl"
              >
                Create Your List
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF STRIP ===== */}
      <section className="border-y border-gray-100">
        <div className="mx-auto max-w-4xl px-8 py-6">
          <p className="text-center text-foreground/60 text-sm md:text-base tracking-wide font-medium">
            Join parents who get it
          </p>
        </div>
      </section>

      {/* ===== FEATURED CREATORS - Horizontal Scroll ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
          <div className="text-center mb-12">
            <p className="text-red font-medium text-sm uppercase tracking-widest mb-4">Trusted by</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">
              Moms Who Get It
            </h2>
            {featuredCreators.length === 0 && (
              <p className="mt-4 text-sm text-foreground/40 italic">Featured Guides (Examples)</p>
            )}
          </div>

          <div className="relative">
            <div className="flex gap-8 overflow-x-auto pb-4 -mx-8 px-8 scrollbar-hide snap-x snap-mandatory">
              {(featuredCreators.length > 0 ? featuredCreators : SAMPLE_CREATORS).map((creator) => (
                <Link
                  key={creator.id}
                  href={featuredCreators.length > 0 ? `/${creator.username}` : "/login"}
                  className="flex-shrink-0 snap-start group text-center w-28 md:w-32"
                >
                  <div className="relative">
                    <Avatar
                      src={creator.avatar_url}
                      name={creator.display_name || creator.username}
                      size="xl"
                      className="mx-auto w-20 h-20 md:w-24 md:h-24 ring-4 ring-white shadow-lg group-hover:ring-red/20 transition-all duration-300"
                    />
                  </div>
                  <div className="mt-4 font-medium text-foreground truncate text-sm">
                    {creator.display_name || creator.username}
                  </div>
                  <div className="text-xs text-foreground/40">
                    {creator.total_followers.toLocaleString()} followers
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== RED VALUE PROPS SECTION ===== */}
      <section className="bg-red text-white">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="grid md:grid-cols-3 gap-16 md:gap-20">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">Giddy Lists</h3>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
                Keep running lists of things your kids want. Update sizes anytime — grandma always sees the latest.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">Giddy Shortlists</h3>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
                Create shareable shortlists for birthdays, holidays, graduations — any gift-giving occasion.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">Earn</h3>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed">
                Every purchase through your lists earns you money. Share with 5 people or 5 million.
              </p>
            </div>
          </div>
          <div className="mt-20 text-center">
            <Link
              href="/login"
              className="inline-block rounded-full bg-white px-12 py-5 text-lg font-semibold text-red hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Start Your List Free
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURED GIDDY GUIDES ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-red font-medium text-sm uppercase tracking-widest mb-4">Earn While You Share</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
                Giddy Guides
              </h2>
              <p className="mt-5 text-lg md:text-xl text-foreground/40 max-w-lg">
                Moms and creators earning by sharing what kids love
              </p>
              {featuredGuides.length === 0 && (
                <p className="mt-2 text-sm text-foreground/40 italic">Featured Guides (Examples)</p>
              )}
            </div>
            <Link
              href="/dashboard/become-guide"
              className="hidden md:inline-flex items-center gap-3 rounded-full bg-red px-8 py-4 font-medium text-white hover:bg-red-hover transition-all duration-200 shadow-lg"
            >
              Become a Guide
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featuredGuides.length > 0 ? featuredGuides : SAMPLE_GUIDES).map((guide) => {
              const tierBadge = guide.guide_tier === "influencer"
                ? { label: "Influencer", color: "bg-purple-100 text-purple-700" }
                : guide.guide_tier === "curator"
                ? { label: "Curator", color: "bg-blue-100 text-blue-700" }
                : guide.guide_tier === "celebrity"
                ? { label: "Celebrity", color: "bg-gold-light text-gold" }
                : null;

              return (
                <Link
                  key={guide.id}
                  href={featuredGuides.length > 0 ? `/guide/${guide.username}` : "/dashboard/become-guide"}
                  className="group rounded-3xl bg-gray-50 p-6 hover:bg-white hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={guide.avatar_url}
                        name={guide.display_name || guide.username}
                        size="xl"
                        className="w-16 h-16 ring-2 ring-white shadow-md"
                      />
                      {guide.is_featured && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-red transition-colors">
                          {guide.display_name || guide.username}
                        </h3>
                        {tierBadge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierBadge.color}`}>
                            {tierBadge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/40">@{guide.username}</p>
                    </div>
                  </div>

                  {guide.guide_bio && (
                    <p className="text-sm text-foreground/60 line-clamp-2 mb-4">
                      {guide.guide_bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/40">
                      {guide.collections_count || 0} collections
                    </span>
                    <span className="text-red font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Shop picks
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA for becoming a guide */}
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-red-light to-gold-light border border-red/10 p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Share what you love. Get paid.
            </h3>
            <p className="mt-4 text-foreground/60 max-w-lg mx-auto">
              Become a Giddy Guide and earn commission when families shop your curated gift lists. No follower minimum required.
            </p>
            <Link
              href="/dashboard/become-guide"
              className="mt-8 inline-block rounded-full bg-red px-10 py-4 text-lg font-semibold text-white hover:bg-red-hover transition-all duration-200 shadow-lg shadow-red/20"
            >
              Start Earning Today
            </Link>
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/dashboard/become-guide"
              className="inline-flex items-center gap-3 rounded-full bg-red px-10 py-5 font-medium text-white hover:bg-red-hover transition-all"
            >
              Become a Guide
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SHOP BY AGE ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              Shop by Age
            </h2>
            <p className="mt-6 text-lg md:text-xl text-foreground/40 max-w-lg mx-auto">
              Curated gift ideas updated daily
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            {AGE_CATEGORIES.map((category) => {
              const gifts = trendingGifts[category.range] || [];
              const hasGifts = gifts.length > 0;

              return (
                <Link
                  key={category.range}
                  href={`/discover/age/${category.range}`}
                  className="group relative rounded-3xl bg-gray-50 p-6 md:p-8 hover:bg-white hover:shadow-xl transition-all duration-300"
                >
                  {hasGifts ? (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {gifts.slice(0, 4).map((gift, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-white overflow-hidden relative shadow-sm">
                          <ProductImage
                            src={gift.image_url}
                            alt={gift.title}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-2xl bg-white overflow-hidden relative shadow-sm mb-6">
                      <Image
                        src={category.image}
                        alt={category.label}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
                      {category.range}
                    </div>
                    <div className="mt-2 text-sm text-foreground/40">
                      {category.label}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center text-sm text-red font-medium">
                    <span>Browse</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CURATED COLLECTIONS ===== */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-red font-medium text-sm uppercase tracking-widest mb-4">Editor's Picks</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
                Discover Lists
              </h2>
              <p className="mt-5 text-lg md:text-xl text-foreground/40 max-w-lg">
                Curated by moms, influencers, and tastemakers you trust
              </p>
            </div>
            <Link
              href="/discover"
              className="hidden md:inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 font-medium text-white hover:bg-foreground/90 transition-all duration-200 shadow-lg"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-white overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-gray-100" />
                  <div className="p-8">
                    <div className="h-6 bg-gray-100 rounded w-3/4" />
                    <div className="mt-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100" />
                      <div className="h-4 bg-gray-100 rounded w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-10">
              {(featuredCollections.length > 0 ? featuredCollections.slice(0, 3) : SAMPLE_COLLECTIONS).map((collection: any) => (
                <Link
                  key={collection.id}
                  href={featuredCollections.length > 0 ? `/collections/${collection.slug}` : "/login"}
                  className="group rounded-3xl bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                >
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    <Image
                      src={collection.cover_image_url || "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=750&fit=crop"}
                      alt={collection.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      unoptimized
                    />

                    {collection.age_range && (
                      <div className="absolute top-6 left-6">
                        <span className="rounded-full bg-white/95 backdrop-blur-sm px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm">
                          Ages {collection.age_range}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
                        {collection.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center gap-5">
                      <Avatar
                        src={collection.creator_profiles?.avatar_url}
                        name={collection.creator_profiles?.display_name}
                        size="lg"
                        className="ring-2 ring-gray-100"
                      />
                      <div>
                        <p className="text-xs text-foreground/40 uppercase tracking-wider">Curated by</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {collection.creator_profiles?.display_name || collection.creator_profiles?.username}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {featuredCollections.length === 0 && !loading && (
            <div className="mt-12 text-center">
              <p className="text-foreground/40 mb-6">Want to create your own gift guide?</p>
              <Link
                href="/login"
                className="inline-block rounded-full bg-red px-10 py-5 text-lg font-medium text-white hover:bg-red-hover transition-all duration-200 shadow-lg shadow-red/20"
              >
                Start Creating
              </Link>
            </div>
          )}

          <div className="mt-16 text-center md:hidden">
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-10 py-5 font-medium text-white hover:bg-foreground/90 transition-all"
            >
              Explore All Lists
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-5xl px-8 py-28 md:py-36">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-12 md:gap-16">
            {[
              { step: 1, title: "Add Your Kids", desc: "Create profiles with ages, sizes, and interests" },
              { step: 2, title: "Build Lists", desc: "Paste product URLs from any store" },
              { step: 3, title: "Share Your Link", desc: "Send to family or post on socials" },
              { step: 4, title: "Earn Money", desc: "Get paid when people buy from your lists" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-20 h-20 rounded-full bg-red text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-red/20">
                  {item.step}
                </div>
                <h3 className="mt-8 text-xl md:text-2xl font-display font-bold text-foreground">{item.title}</h3>
                <p className="mt-4 text-foreground/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="text-center mb-16">
            <p className="text-red font-medium text-sm uppercase tracking-widest mb-4">Why Giddy Lists?</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              How Giddy Lists Help
            </h2>
            <p className="mt-4 text-sm text-foreground/40 italic">Illustrative examples of what parents experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                quote: "Finally, a registry that grows with my kids! No more outdated sizes or duplicate gifts.",
                name: "Sarah Mitchell",
                role: "Mom of 3",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "Grandma actually bought the right size for once. This has been a game-changer for our family.",
                name: "Jessica Taylor",
                role: "Mom of 2",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
              },
              {
                quote: "I've earned over $500 just by sharing my gift guides. It's like getting paid for recommendations I'd make anyway.",
                name: "Amanda Kim",
                role: "Mom & Creator",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 md:p-10 shadow-sm">
                <svg className="w-10 h-10 text-red/20 mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-lg md:text-xl text-foreground leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-foreground/40">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              Browse by Category
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {[
              { slug: "toys", label: "Toys & Games", icon: Gamepad2 },
              { slug: "clothing", label: "Clothing", icon: Shirt },
              { slug: "books", label: "Books", icon: BookOpen },
              { slug: "gear", label: "Gear", icon: Baby },
              { slug: "room-decor", label: "Room Decor", icon: Bed },
              { slug: "outdoor", label: "Outdoor", icon: TreePine },
              { slug: "arts-crafts", label: "Arts & Crafts", icon: Palette },
              { slug: "electronics", label: "Electronics", icon: Laptop },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/discover/category/${cat.slug}`}
                className="group rounded-2xl bg-gray-50 p-8 md:p-10 text-center hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red/10 flex items-center justify-center group-hover:bg-red/20 transition-colors">
                  <cat.icon className="w-6 h-6 text-red" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-bold text-foreground group-hover:text-red transition-colors">
                  {cat.label}
                </h3>
                <div className="mt-3 flex items-center justify-center text-sm text-foreground/30 group-hover:text-red transition-colors">
                  <span>Shop</span>
                  <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-3xl px-8 py-28 md:py-36">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              Questions? Answered.
            </h2>
          </div>

          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ===== BRAND DEFINITION MOMENT ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-8 py-32 md:py-44 text-center">
          <div className="space-y-3">
            <p
              className="text-3xl md:text-4xl lg:text-5xl font-bold italic text-foreground"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              gid·dy
            </p>
            <p className="text-base md:text-lg text-foreground/40 font-light tracking-wide">
              /ˈɡidē/
            </p>
          </div>
          <p className="mt-8 text-lg md:text-xl text-foreground/60 leading-relaxed max-w-md mx-auto">
            <span className="italic text-foreground/40">(noun)</span>{" "}
            that face they make when they tear open the wrapping paper and it's exactly what they wanted.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="bg-red text-white">
        <div className="mx-auto max-w-4xl px-8 py-28 md:py-36 text-center">
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.9]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Make them giddy.
          </h2>
          <p className="mt-8 text-xl md:text-2xl text-white/70">
            Start your list today — it's free.
          </p>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/discover"
              className="w-full sm:w-auto rounded-full bg-white px-12 py-5 text-lg font-semibold text-red hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Explore Lists
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full border-2 border-white px-12 py-5 text-lg font-semibold text-white hover:bg-white/10 transition-all duration-200"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-foreground text-white/50">
        <div className="mx-auto max-w-6xl px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div
                className="text-2xl font-black text-white"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
              >
                The Giddy List
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                Where every kid gets the perfect gift.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Discover</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/guides" className="hover:text-white transition-colors">Giddy Guides</Link></li>
                <li><Link href="/discover/age/0-2" className="hover:text-white transition-colors">Baby & Toddler</Link></li>
                <li><Link href="/discover/age/3-5" className="hover:text-white transition-colors">Preschool</Link></li>
                <li><Link href="/discover/age/6-8" className="hover:text-white transition-colors">Elementary</Link></li>
                <li><Link href="/discover/age/9-12" className="hover:text-white transition-colors">Tweens</Link></li>
                <li><Link href="/discover/age/13-18" className="hover:text-white transition-colors">Teens</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Create</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Start a Giddy List</Link></li>
                <li><Link href="/registry" className="hover:text-white transition-colors">Giddy Shortlists</Link></li>
                <li><Link href="/guides" className="hover:text-white transition-colors">Giddy Guides</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/30">
              © {new Date().getFullYear()} The Giddy List. Made with love for parents who get it.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
