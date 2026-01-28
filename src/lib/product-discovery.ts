import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { scrapeProduct } from './scraper';
import { AgeRange, CollectionCategory, Product } from './types';
import { AGE_RANGE_NAMES, CATEGORY_NAMES } from './topic-rotation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AIProductRecommendation {
  name: string;
  brand: string;
  estimatedPrice: number;
  description: string;
  whyPopular: string;
  searchQuery: string;
  amazonAsin: string | null;
  imageSearchTerm: string;
}

const DISCOVERY_SYSTEM_PROMPT = `You are a product research expert for The Giddy List, a children's gift recommendation platform trusted by parents.

Your job is to recommend real, specific, popular products that parents actually buy and love. You should consider:
- Products trending on TikTok and Instagram among parents
- Top-rated bestsellers on Amazon in kids/baby categories
- Products featured in major gift guides (Good Housekeeping, Wirecutter, Parents Magazine)
- Viral toys and products from mommy blogs and YouTube reviews
- Classic favorites that consistently get 5-star reviews

CRITICAL RULES:
1. Only recommend REAL products that actually exist and can be purchased
2. Include the exact brand name and product name
3. If you know the Amazon ASIN (the 10-character alphanumeric ID), include it
4. Provide a specific Amazon search query that would find this exact product
5. Cover a range of price points (budget, mid-range, premium)
6. Include a mix of trending/new items and proven classics
7. Focus on quality, safety, and educational value

Return a JSON array of product objects. No markdown, no explanation, just the JSON array.`;

function buildDiscoveryPrompt(
  ageRange: AgeRange,
  category?: CollectionCategory,
  count: number = 10
): string {
  const ageName = AGE_RANGE_NAMES[ageRange] || ageRange;
  const categoryName = category ? CATEGORY_NAMES[category] : null;

  let prompt = `Find ${count} popular and trending gift products for children ages ${ageName}.`;

  if (categoryName) {
    prompt += ` Focus specifically on the "${categoryName}" category.`;
  }

  prompt += `

Consider what's currently popular on social media, Amazon bestsellers, and major gift guides.
Mix trending new products with proven favorites. Include various price points.

Return this exact JSON structure (array of objects):
[
  {
    "name": "Exact Product Name",
    "brand": "Brand Name",
    "estimatedPrice": 29.99,
    "description": "2-3 sentences about why parents love this product and what makes it special for this age group.",
    "whyPopular": "Brief reason - e.g., 'TikTok viral with 50M views' or 'Amazon #1 bestseller in toys' or 'Wirecutter top pick 2025'",
    "searchQuery": "exact amazon search query to find this product",
    "amazonAsin": "B0XXXXXXXX or null if unknown",
    "imageSearchTerm": "short descriptive term for finding an image of this product"
  }
]`;

  return prompt;
}

// Get AI product recommendations
async function getAIProductRecommendations(
  ageRange: AgeRange,
  category?: CollectionCategory,
  count: number = 10
): Promise<AIProductRecommendation[]> {
  const userPrompt = buildDiscoveryPrompt(ageRange, category, count);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 3000,
  });

  const responseText = completion.choices[0]?.message?.content || '[]';

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON array found');
  } catch (error) {
    console.error('Failed to parse AI product recommendations:', error);
    console.error('Response:', responseText);
    return [];
  }
}

// Try to scrape product data from Amazon
async function tryScrapProduct(
  asin: string | null,
  searchQuery: string
): Promise<{
  image_url: string | null;
  price: number | null;
  title: string | null;
  description: string | null;
  original_url: string;
  affiliate_url: string;
}> {
  const affiliateTag = process.env.AMAZON_AFFILIATE_TAG || 'thegiddylist-20';

  // If we have an ASIN, try to scrape the product page
  if (asin) {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    try {
      const scraped = await scrapeProduct(productUrl);
      if (scraped.title) {
        return {
          image_url: scraped.image_url,
          price: scraped.price,
          title: scraped.title,
          description: scraped.description,
          original_url: productUrl,
          affiliate_url: `https://www.amazon.com/dp/${asin}?tag=${affiliateTag}`,
        };
      }
    } catch (error) {
      console.log(`Scrape failed for ASIN ${asin}, using search URL`);
    }
  }

  // Fallback: use Amazon search URL as affiliate link
  const encodedQuery = encodeURIComponent(searchQuery);
  return {
    image_url: null,
    price: null,
    title: null,
    description: null,
    original_url: `https://www.amazon.com/s?k=${encodedQuery}`,
    affiliate_url: `https://www.amazon.com/s?k=${encodedQuery}&tag=${affiliateTag}`,
  };
}

// Discover and save products for a given age range and optional category
export async function discoverProducts(
  ageRange: AgeRange,
  category?: CollectionCategory,
  count: number = 10
): Promise<{ products: Product[]; newCount: number; skippedCount: number }> {
  const supabase = getServiceClient();
  const savedProducts: Product[] = [];
  let newCount = 0;
  let skippedCount = 0;

  // Get AI recommendations
  const recommendations = await getAIProductRecommendations(ageRange, category, count);

  if (recommendations.length === 0) {
    return { products: [], newCount: 0, skippedCount: 0 };
  }

  for (const rec of recommendations) {
    try {
      // Check if product already exists by ASIN or similar title
      if (rec.amazonAsin) {
        const { data: existing } = await supabase
          .from('products')
          .select('*')
          .eq('asin', rec.amazonAsin)
          .maybeSingle();

        if (existing) {
          savedProducts.push(existing as Product);
          skippedCount++;
          continue;
        }
      }

      // Check by similar title to avoid duplicates
      const { data: titleMatch } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `%${rec.name.slice(0, 30)}%`)
        .limit(1)
        .maybeSingle();

      if (titleMatch) {
        savedProducts.push(titleMatch as Product);
        skippedCount++;
        continue;
      }

      // Try to scrape real product data
      const scraped = await tryScrapProduct(rec.amazonAsin, rec.searchQuery);

      // Save to database
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          asin: rec.amazonAsin || null,
          title: scraped.title || rec.name,
          description: scraped.description || rec.description,
          image_url: scraped.image_url || null,
          price: scraped.price || rec.estimatedPrice,
          original_url: scraped.original_url,
          affiliate_url: scraped.affiliate_url,
          retailer: 'amazon',
          age_range: ageRange,
          category: category || null,
          brand: rec.brand,
          is_active: true,
          last_scraped_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`Failed to save product "${rec.name}":`, error);
        continue;
      }

      savedProducts.push(newProduct as Product);
      newCount++;

      // Small delay between scrape attempts to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing product "${rec.name}":`, error);
    }
  }

  return { products: savedProducts, newCount, skippedCount };
}

// Discover products for all age ranges (used by cron for bulk seeding)
export async function discoverProductsForAllAges(
  categories?: CollectionCategory[]
): Promise<{ totalNew: number; totalSkipped: number }> {
  const ageRanges: AgeRange[] = ['0-2', '3-5', '6-8', '9-12', '13-18'];
  let totalNew = 0;
  let totalSkipped = 0;

  for (const ageRange of ageRanges) {
    if (categories && categories.length > 0) {
      for (const category of categories) {
        const result = await discoverProducts(ageRange, category, 6);
        totalNew += result.newCount;
        totalSkipped += result.skippedCount;
      }
    } else {
      // Discover general products for each age
      const result = await discoverProducts(ageRange, undefined, 8);
      totalNew += result.newCount;
      totalSkipped += result.skippedCount;
    }
  }

  return { totalNew, totalSkipped };
}

// Discover products specifically for a guide topic
export async function discoverProductsForTopic(
  topicType: string,
  topicParams: string[]
): Promise<Product[]> {
  const supabase = getServiceClient();

  // Determine age range and category from topic
  let ageRange: AgeRange | undefined;
  let category: CollectionCategory | undefined;

  if (topicType === 'age' && topicParams.length > 0) {
    ageRange = topicParams[0] as AgeRange;
  } else if (topicType === 'category' && topicParams.length > 0) {
    category = topicParams[0] as CollectionCategory;
  } else if (topicType === 'occasion' || topicType === 'seasonal') {
    // For occasions/seasonal, discover across all ages
    ageRange = undefined;
  }

  // First check if we have enough existing products
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (ageRange) {
    query = query.eq('age_range', ageRange);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data: existing } = await query.limit(10);

  // If we have at least 5 products, use them
  if (existing && existing.length >= 5) {
    return existing as Product[];
  }

  // Otherwise, discover new products
  console.log(`Not enough products for ${topicType}:${topicParams.join(',')}. Discovering...`);

  const result = await discoverProducts(
    ageRange || '3-5', // Default to 3-5 if no age specified
    category,
    10
  );

  return result.products;
}
