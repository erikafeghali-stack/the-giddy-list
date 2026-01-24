import { GuideTier, CommissionSplit } from "./types";

/**
 * Commission split percentages by tier
 * Higher tiers earn a larger share of affiliate commissions
 */
const TIER_SPLITS: Record<GuideTier, { guide: number; platform: number }> = {
  standard: { guide: 50, platform: 50 },    // 50% to guide, 50% to platform
  curator: { guide: 60, platform: 40 },     // 60% to guide, 40% to platform
  influencer: { guide: 70, platform: 30 },  // 70% to guide, 30% to platform
  celebrity: { guide: 75, platform: 25 },   // 75% to guide, 25% to platform
};

/**
 * Calculate the commission split between guide and platform
 * @param tier - The guide's tier level
 * @param totalCommission - Total commission amount from affiliate
 * @returns CommissionSplit with amounts and percentages
 */
export function calculateGuideSplit(
  tier: GuideTier,
  totalCommission: number
): CommissionSplit {
  const split = TIER_SPLITS[tier] || TIER_SPLITS.standard;

  const guideShare = Number(((totalCommission * split.guide) / 100).toFixed(2));
  const platformShare = Number(((totalCommission * split.platform) / 100).toFixed(2));

  return {
    guide_share: guideShare,
    platform_share: platformShare,
    guide_percentage: split.guide,
    platform_percentage: split.platform,
  };
}

/**
 * Get the split percentages for a tier
 * @param tier - The guide's tier level
 * @returns Object with guide and platform percentages
 */
export function getTierSplit(tier: GuideTier): { guide: number; platform: number } {
  return TIER_SPLITS[tier] || TIER_SPLITS.standard;
}

/**
 * Get tier display information
 * @param tier - The guide's tier level
 * @returns Display name and description
 */
export function getTierInfo(tier: GuideTier): { name: string; description: string; badge: string } {
  const tiers: Record<GuideTier, { name: string; description: string; badge: string }> = {
    standard: {
      name: "Giddy Guide",
      description: "Starting tier for all new guides",
      badge: "",
    },
    curator: {
      name: "Curator",
      description: "Recognized for quality curation",
      badge: "Curator",
    },
    influencer: {
      name: "Influencer",
      description: "Top-performing guide with significant reach",
      badge: "Influencer",
    },
    celebrity: {
      name: "Celebrity Guide",
      description: "Elite partner with premium benefits",
      badge: "Celebrity",
    },
  };

  return tiers[tier] || tiers.standard;
}

/**
 * Minimum payout threshold in dollars
 */
export const MINIMUM_PAYOUT = 25.00;

/**
 * Check if guide can request a payout
 * @param availableBalance - Current available balance
 * @returns Whether payout can be requested
 */
export function canRequestPayout(availableBalance: number): boolean {
  return availableBalance >= MINIMUM_PAYOUT;
}

/**
 * Format currency for display
 * @param amount - Amount in dollars
 * @returns Formatted string
 */
export function formatEarnings(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Calculate estimated monthly earnings based on views
 * Assumes average conversion rate and commission
 * @param monthlyViews - Estimated monthly views
 * @param tier - Guide's tier level
 * @returns Estimated monthly earnings
 */
export function estimateMonthlyEarnings(
  monthlyViews: number,
  tier: GuideTier = "standard"
): number {
  // Industry averages:
  // - Click-through rate: ~2%
  // - Conversion rate: ~3%
  // - Average order value: $50
  // - Average commission: 4%

  const clickThroughRate = 0.02;
  const conversionRate = 0.03;
  const averageOrderValue = 50;
  const averageCommission = 0.04;

  const clicks = monthlyViews * clickThroughRate;
  const conversions = clicks * conversionRate;
  const totalCommission = conversions * averageOrderValue * averageCommission;

  const split = calculateGuideSplit(tier, totalCommission);
  return Number(split.guide_share.toFixed(2));
}

/**
 * Generate affiliate URL with tracking parameters
 * @param originalUrl - Original product URL
 * @param guideId - Guide's user ID
 * @param sourceType - Source of the click
 * @param sourceId - ID of the source (collection, registry, etc.)
 * @returns Tracking URL
 */
export function generateTrackingUrl(
  originalUrl: string,
  guideId: string,
  sourceType: string,
  sourceId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thegiddylist.com";
  const params = new URLSearchParams({
    url: originalUrl,
    guide: guideId,
    source: sourceType,
    sid: sourceId,
  });

  return `${baseUrl}/api/track/click?${params.toString()}`;
}
