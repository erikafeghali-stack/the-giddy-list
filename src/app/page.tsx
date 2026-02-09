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
    question: "How does Giddy List work?",
    answer: "Create a free account, add your kids with their ages and sizes, then build wishlists by pasting product URLs from any store. Share your unique link with family and friends — they can see exactly what your kids want and mark items as purchased."
  },
  {
    question: "What's the difference between wishlists, registries, and guides?",
    answer: "Wishlists are ongoing personal lists of things your kids want. Registries are event-specific lists for birthdays, holidays, or special occasions. Guides are curated recommendations you create to share publicly and earn commission when people shop."
  },
  {
    question: "How do I earn money?",
    answer: "When you create gift guides and someone purchases through your recommendations, you earn a commission. This only applies to guides — personal wishlists and registries are free for families and don't earn money."
  },
  {
    question: "Can I add items from any store?",
    answer: "Yes! Paste product URLs from Amazon, Target, Walmart, boutique shops, or anywhere else. Our system automatically pulls in product details, images, and pricing. If a store isn't supported yet, you can manually add items."
  },
  {
    question: "Is this different from a baby registry?",
    answer: "Giddy List works for kids of ALL ages (0-18), not just babies. You can keep running wishlists that grow with your kids, plus create registries for any occasion — birthdays, holidays, graduations, and more."
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
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] md:max-h-[1000px] overflow-hidden">
        <AnimatedImageGrid variant="hero" />
        {/* Gradient overlays for text readability without obscuring images */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-24 md:pb-28 px-6 text-center">
          <h1
            className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tight"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5), 0 4px 60px rgba(0,0,0,0.3)" }}
          >
            Gifts that make<br />them giddy.
          </h1>

          <p
            className="mt-5 md:mt-6 text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)" }}
          >
            Wishlists for your family. Gift Guides that earn you money. All in one curated place.
          </p>

          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full bg-red px-10 py-4 md:px-12 md:py-5 text-base md:text-lg font-semibold text-white hover:bg-red-hover transition-all duration-200 hover:scale-[1.02] shadow-2xl"
            >
              Start Free
            </Link>
            <Link
              href="/dashboard/become-guide"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-gold-light to-gold px-10 py-4 md:px-12 md:py-5 text-base md:text-lg font-semibold text-foreground hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            >
              Create & Earn
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPS - SPLIT SECTION ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {/* FOR FAMILIES */}
            <div className="rounded-3xl bg-red-light/30 p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">For Families</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Wishlists</h3>
                  <p className="mt-1 text-foreground/60">Keep running lists of things your kids want. Update sizes anytime — grandma always sees the latest.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Registries</h3>
                  <p className="mt-1 text-foreground/60">Create shareable lists for birthdays, holidays, graduations — any gift-giving occasion.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Always Free</h3>
                  <p className="mt-1 text-foreground/60">No cost to create and share lists with your family and friends.</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-red px-8 py-3 text-base font-semibold text-white hover:bg-red-hover transition-all"
              >
                Start Free
              </Link>
            </div>

            {/* FOR CREATORS */}
            <div className="rounded-3xl bg-gradient-to-br from-gold-light/40 to-gold-light/20 p-8 md:p-10 border border-gold/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">For Creators</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Guides</h3>
                  <p className="mt-1 text-foreground/60">Curate gift recommendations for other parents. Share your expertise on the best toys, gear, and gifts.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Earn</h3>
                  <p className="mt-1 text-foreground/60">Get paid commission when people shop your guides. Share with 5 people or 5 million.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No Minimum</h3>
                  <p className="mt-1 text-foreground/60">Any parent can become a creator. No follower count required to start earning.</p>
                </div>
              </div>

              <Link
                href="/dashboard/become-guide"
                className="mt-8 inline-block rounded-full bg-gradient-to-r from-gold to-gold-dark px-8 py-3 text-base font-semibold text-white hover:opacity-90 transition-all"
              >
                Create & Earn
              </Link>
            </div>
          </div>

          {/* Earning Disclaimer */}
          <div className="mt-12 rounded-2xl border border-gold/30 bg-gradient-to-r from-gold-light/20 to-white p-6 flex items-start gap-4">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <p className="text-foreground/70">
              <span className="font-semibold text-foreground">Personal wishlists and registries are free for families.</span> Only gift guide creators earn money when people shop their recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - SPLIT SECTION ===== */}
      <section id="how-it-works" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {/* Family Lists Flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">Family Lists</h3>
              </div>

              <div className="space-y-6">
                {[
                  { step: 1, title: "Add Your Kids", desc: "Ages, sizes, and interests" },
                  { step: 2, title: "Build Lists", desc: "Paste URLs from any store" },
                  { step: 3, title: "Share Your Link", desc: "Family buys what they want" },
                  { step: 4, title: "Get Perfect Gifts", desc: "No duplicates, right sizes" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red text-white font-bold flex items-center justify-center shadow-lg shadow-red/20">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-foreground/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-red px-8 py-3 text-base font-semibold text-white hover:bg-red-hover transition-all"
              >
                Start Free
              </Link>
            </div>

            {/* Create Guides & Earn Flow */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">Create Guides & Earn</h3>
              </div>

              <div className="space-y-6">
                {[
                  { step: 1, title: "Curate Products", desc: "Pick great gifts by age/category" },
                  { step: 2, title: "Write Your Guide", desc: "Share your expertise" },
                  { step: 3, title: "Publish & Share", desc: "Get your unique guide link" },
                  { step: 4, title: "Earn Commission", desc: "Get paid when people shop" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold text-white font-bold flex items-center justify-center shadow-lg shadow-gold/20">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-foreground/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard/become-guide"
                className="mt-8 inline-block rounded-full bg-gradient-to-r from-gold to-gold-dark px-8 py-3 text-base font-semibold text-white hover:opacity-90 transition-all"
              >
                Create & Earn
              </Link>
            </div>
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

      {/* ===== FEATURED GUIDES ===== */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-gold font-medium text-sm uppercase tracking-widest mb-4">Earn While You Share</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
                Featured Guides
              </h2>
              <p className="mt-5 text-lg md:text-xl text-foreground/40 max-w-lg">
                Parents earning by sharing what kids love
              </p>
            </div>
            <Link
              href="/dashboard/become-guide"
              className="hidden md:inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-gold to-gold-dark px-8 py-4 font-medium text-white hover:opacity-90 transition-all duration-200 shadow-lg"
            >
              Create & Earn
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
                  className="group rounded-3xl bg-white p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={guide.avatar_url}
                        name={guide.display_name || guide.username}
                        size="xl"
                        className="w-16 h-16 ring-2 ring-white shadow-md"
                      />
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
                      {guide.collections_count || 0} guides
                    </span>
                    <span className="text-gold font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
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

          <div className="mt-12 text-center md:hidden">
            <Link
              href="/dashboard/become-guide"
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-gold to-gold-dark px-10 py-5 font-medium text-white hover:opacity-90 transition-all"
            >
              Create & Earn
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CURATED COLLECTIONS ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-8 py-28 md:py-36">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-red font-medium text-sm uppercase tracking-widest mb-4">Editor&apos;s Picks</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
                Discover Guides
              </h2>
              <p className="mt-5 text-lg md:text-xl text-foreground/40 max-w-lg">
                Curated by parents and tastemakers you trust
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
                <div key={i} className="rounded-3xl bg-gray-50 overflow-hidden animate-pulse">
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
              {(featuredCollections.length > 0 ? featuredCollections.slice(0, 3) : SAMPLE_COLLECTIONS).map((collection: CollectionWithCreator | typeof SAMPLE_COLLECTIONS[0]) => (
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

          <div className="mt-16 text-center md:hidden">
            <Link
              href="/discover"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-10 py-5 font-medium text-white hover:bg-foreground/90 transition-all"
            >
              Explore All Guides
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="bg-gray-50">
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
                className="group rounded-2xl bg-white p-8 md:p-10 text-center hover:shadow-xl transition-all duration-300"
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
      <section className="bg-white">
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
      <section className="bg-gray-50">
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
            that face they make when they tear open the wrapping paper and it&apos;s exactly what they wanted.
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
            Create wishlists for free. Or build guides and earn.
          </p>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full bg-white px-12 py-5 text-lg font-semibold text-red hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Start Free
            </Link>
            <Link
              href="/dashboard/become-guide"
              className="w-full sm:w-auto rounded-full border-2 border-gold bg-gold/20 px-12 py-5 text-lg font-semibold text-white hover:bg-gold/30 transition-all duration-200"
            >
              Create & Earn
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="The Giddy List"
                className="h-10 w-auto brightness-0 invert"
              />
              <p className="mt-4 text-sm leading-relaxed">
                Wishlists for families. Guides that earn.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Discover</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/guides" className="hover:text-white transition-colors">Browse Guides</Link></li>
                <li><Link href="/discover/age/0-2" className="hover:text-white transition-colors">Baby & Toddler</Link></li>
                <li><Link href="/discover/age/3-5" className="hover:text-white transition-colors">Preschool</Link></li>
                <li><Link href="/discover/age/6-8" className="hover:text-white transition-colors">Elementary</Link></li>
                <li><Link href="/discover/age/9-12" className="hover:text-white transition-colors">Tweens</Link></li>
                <li><Link href="/discover/age/13-18" className="hover:text-white transition-colors">Teens</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">For Families</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Create Wishlist</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Create Registry</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">For Creators</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/dashboard/become-guide" className="hover:text-white transition-colors">Create & Earn</Link></li>
                <li><Link href="/collections/new" className="hover:text-white transition-colors">Create a Guide</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/30">
              © {new Date().getFullYear()} Giddy List. Made with love for parents who get it.
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
