import { Retailer, ScrapedProduct } from './types';

// ASIN extraction patterns for Amazon products
const ASIN_PATTERNS = [
  /\/dp\/([A-Z0-9]{10})/i,
  /\/gp\/product\/([A-Z0-9]{10})/i,
  /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
  /\/([A-Z0-9]{10})(?:[/?]|$)/i,
];

// Detect retailer from URL hostname
export function detectRetailer(url: string): Retailer {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('amazon.com') || hostname.includes('amzn.to') || hostname.includes('amzn.com')) {
      return 'amazon';
    }
    if (hostname.includes('walmart.com')) {
      return 'walmart';
    }
    if (hostname.includes('target.com')) {
      return 'target';
    }

    return 'other';
  } catch {
    return 'other';
  }
}

// Extract ASIN from Amazon URL
export function extractAsin(url: string): string | null {
  for (const pattern of ASIN_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Verify it's alphanumeric and 10 chars
      const potential = match[1].toUpperCase();
      if (/^[A-Z0-9]{10}$/.test(potential)) {
        return potential;
      }
    }
  }
  return null;
}

// Parse price string to number
export function parsePrice(priceString: string | null | undefined): number | null {
  if (!priceString) return null;

  // Remove currency symbols and commas, extract number
  const cleaned = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+\.?\d*)/);

  if (match) {
    const price = parseFloat(match[1]);
    return isNaN(price) ? null : price;
  }

  return null;
}

// Extract meta tag content from HTML
function extractMetaContent(html: string, property: string): string | null {
  // Try og: prefix first
  const ogPatterns = [
    new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i'),
  ];

  for (const pattern of ogPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  // Try name attribute
  const namePatterns = [
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'),
  ];

  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return null;
}

// Extract title from HTML
function extractTitle(html: string): string | null {
  // Try Open Graph title first
  const ogTitle = extractMetaContent(html, 'title');
  if (ogTitle) return ogTitle;

  // Fall back to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }

  return null;
}

// Extract price from various HTML patterns
function extractPriceFromHtml(html: string, retailer: Retailer): { price: number | null; currency: string } {
  let priceString: string | null = null;

  // Try og:price:amount first
  priceString = extractMetaContent(html, 'price:amount');
  if (priceString) {
    const currency = extractMetaContent(html, 'price:currency') || 'USD';
    return { price: parsePrice(priceString), currency };
  }

  // Retailer-specific patterns
  if (retailer === 'amazon') {
    // Amazon price patterns
    const amazonPatterns = [
      /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)/i,
      /<span[^>]*id="priceblock_ourprice"[^>]*>\s*\$?([\d,.]+)/i,
      /<span[^>]*id="priceblock_dealprice"[^>]*>\s*\$?([\d,.]+)/i,
      /data-a-color="price"[^>]*>\s*<span[^>]*>\s*\$?([\d,.]+)/i,
    ];

    for (const pattern of amazonPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceString = match[1];
        break;
      }
    }
  } else if (retailer === 'walmart') {
    const walmartPatterns = [
      /<span[^>]*itemprop="price"[^>]*content="([\d.]+)"/i,
      /\$\s*([\d,.]+)\s*<\/span>/i,
    ];

    for (const pattern of walmartPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceString = match[1];
        break;
      }
    }
  } else if (retailer === 'target') {
    const targetPatterns = [
      /\$\s*([\d,.]+)/,
      /<span[^>]*data-test="product-price"[^>]*>\s*\$?([\d,.]+)/i,
    ];

    for (const pattern of targetPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceString = match[1];
        break;
      }
    }
  }

  // Generic fallback: look for price meta or common price patterns
  if (!priceString) {
    const genericPatterns = [
      /price['"]\s*:\s*['"]\$?([\d,.]+)/i,
      /"price"\s*:\s*([\d.]+)/i,
    ];

    for (const pattern of genericPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceString = match[1];
        break;
      }
    }
  }

  return { price: parsePrice(priceString), currency: 'USD' };
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return decoded;
}

// Scrape product metadata from URL
export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const retailer = detectRetailer(url);
  const asin = retailer === 'amazon' ? extractAsin(url) : null;

  try {
    // Fetch the page with a browser-like user agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata
    const title = extractTitle(html);
    const description = extractMetaContent(html, 'description');
    const imageUrl = extractMetaContent(html, 'image');
    const { price, currency } = extractPriceFromHtml(html, retailer);

    return {
      title,
      description,
      image_url: imageUrl,
      price,
      currency,
      retailer,
      asin,
      original_url: url,
      affiliate_url: null, // Will be set by affiliate.ts
    };
  } catch (error) {
    // Return partial data on error
    console.error('Scrape error:', error);
    return {
      title: null,
      description: null,
      image_url: null,
      price: null,
      currency: 'USD',
      retailer,
      asin,
      original_url: url,
      affiliate_url: null,
    };
  }
}

// Clean up and normalize URL
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'ref_', 'tag'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));

    return parsed.toString();
  } catch {
    return url;
  }
}
