import { Retailer, ScrapedProduct } from './types';
import { extractAsin } from './scraper';

// Get affiliate tag from environment
function getAmazonTag(): string | null {
  return process.env.AMAZON_AFFILIATE_TAG || null;
}

// Convert Amazon URL to affiliate link
export function createAmazonAffiliateUrl(url: string, asin: string | null): string | null {
  const tag = getAmazonTag();
  if (!tag) return null;

  // If we have an ASIN, create a clean affiliate link
  const productAsin = asin || extractAsin(url);
  if (productAsin) {
    return `https://www.amazon.com/dp/${productAsin}?tag=${tag}`;
  }

  // Otherwise, append tag to existing URL
  try {
    const parsed = new URL(url);

    // Remove existing tag if present
    parsed.searchParams.delete('tag');

    // Add our affiliate tag
    parsed.searchParams.set('tag', tag);

    return parsed.toString();
  } catch {
    return null;
  }
}

// Convert URL to affiliate link based on retailer
export function createAffiliateUrl(url: string, retailer: Retailer, asin: string | null): string | null {
  switch (retailer) {
    case 'amazon':
      return createAmazonAffiliateUrl(url, asin);

    case 'walmart':
      // Walmart affiliate program requires CJ/Impact partnership
      // For MVP, return null (use original URL)
      return null;

    case 'target':
      // Target affiliate program requires Impact partnership
      // For MVP, return null (use original URL)
      return null;

    default:
      return null;
  }
}

// Add affiliate link to scraped product data
export function addAffiliateLink(product: ScrapedProduct): ScrapedProduct {
  const affiliateUrl = createAffiliateUrl(
    product.original_url,
    product.retailer,
    product.asin
  );

  return {
    ...product,
    affiliate_url: affiliateUrl,
  };
}

// Get the best URL to use for display (affiliate if available, otherwise original)
export function getBestUrl(affiliateUrl: string | null, originalUrl: string): string {
  return affiliateUrl || originalUrl;
}

// Check if URL is an affiliate link
export function isAffiliateLink(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Check for Amazon affiliate tag
    if (parsed.hostname.includes('amazon') && parsed.searchParams.has('tag')) {
      return true;
    }

    // Add checks for other affiliate programs as needed
    return false;
  } catch {
    return false;
  }
}

// Get affiliate tag from URL if present
export function getAffiliateTag(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('tag');
  } catch {
    return null;
  }
}

// Strip affiliate tag from URL
export function stripAffiliateTag(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('tag');
    return parsed.toString();
  } catch {
    return url;
  }
}
