import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AgeRange, CollectionCategory, TrendingGift } from '@/lib/types';
import { scrapeProduct } from '@/lib/scraper';
import { addAffiliateLink } from '@/lib/affiliate';

// Helper to get Supabase admin client (only when keys are available)
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

// Age-appropriate search terms for different age ranges
const AGE_SEARCH_TERMS: Record<AgeRange, string[]> = {
  '0-2': [
    'best baby toys',
    'toddler gifts',
    'infant learning toys',
    'baby development toys',
    'first birthday gifts',
  ],
  '3-5': [
    'preschool toys',
    'educational toys ages 3-5',
    'best toys for preschoolers',
    'imagination play toys',
    'outdoor toys toddlers',
  ],
  '6-8': [
    'best toys for 6 year olds',
    'kids stem toys',
    'building toys kids',
    'board games for kids',
    'arts and crafts kids',
  ],
  '9-12': [
    'tween gifts',
    'stem kits kids',
    'popular toys 9-12',
    'building sets kids',
    'science kits kids',
  ],
  '13-18': [
    'teen gifts',
    'gifts for teenagers',
    'teen tech gifts',
    'popular teen items',
    'teen hobby gifts',
  ],
};

// Category-specific search modifiers
const CATEGORY_MODIFIERS: Record<CollectionCategory, string> = {
  'toys': 'toys',
  'clothing': 'kids clothes fashion',
  'books': 'children books',
  'gear': 'kids gear equipment',
  'room-decor': 'kids room decor',
  'outdoor': 'outdoor toys kids',
  'arts-crafts': 'arts crafts kids',
  'electronics': 'kids electronics tech',
  'sports': 'kids sports equipment',
  'other': '',
};

// Curated trending products data with real Amazon images (proxied)
const CURATED_TRENDING_GIFTS: Partial<TrendingGift>[] = [
  // 0-2 Age Range
  {
    title: 'Fisher-Price Laugh & Learn Smart Stages Piggy Bank',
    description: 'Interactive piggy bank with songs, sounds, and phrases that teach counting, colors, and more.',
    image_url: 'https://m.media-amazon.com/images/I/81qYpf1Ql9L._AC_SL1500_.jpg',
    price: 19.99,
    product_url: 'https://www.amazon.com/dp/B07MDHF4CP',
    age_range: '0-2',
    category: 'toys',
    trending_score: 95,
  },
  {
    title: 'Baby Einstein Take Along Tunes Musical Toy',
    description: 'Portable music player with 7 classical melodies for on-the-go entertainment.',
    image_url: 'https://m.media-amazon.com/images/I/81nOvKKzMRL._AC_SL1500_.jpg',
    price: 12.99,
    product_url: 'https://www.amazon.com/dp/B000YDDF6O',
    age_range: '0-2',
    category: 'toys',
    trending_score: 92,
  },
  {
    title: 'Melissa & Doug Wooden Building Blocks Set',
    description: '100 classic wooden blocks in 4 colors and 9 shapes for endless building fun.',
    image_url: 'https://m.media-amazon.com/images/I/91hH4VB7YwL._AC_SL1500_.jpg',
    price: 24.99,
    product_url: 'https://www.amazon.com/dp/B00008W72D',
    age_range: '0-2',
    category: 'toys',
    trending_score: 90,
  },
  // 3-5 Age Range
  {
    title: 'LEGO DUPLO Classic Brick Box Building Set',
    description: 'Starter brick set perfect for preschoolers to build, create, and imagine.',
    image_url: 'https://m.media-amazon.com/images/I/91lNnxeFaxL._AC_SL1500_.jpg',
    price: 34.99,
    product_url: 'https://www.amazon.com/dp/B084KPTLXR',
    age_range: '3-5',
    category: 'toys',
    trending_score: 98,
  },
  {
    title: 'Play-Doh Modeling Compound 10-Pack Case of Colors',
    description: 'Classic creative play with 10 vibrant colors of non-toxic compound.',
    image_url: 'https://m.media-amazon.com/images/I/81Ri0KEFVPL._AC_SL1500_.jpg',
    price: 9.99,
    product_url: 'https://www.amazon.com/dp/B00JM5GW10',
    age_range: '3-5',
    category: 'arts-crafts',
    trending_score: 96,
  },
  {
    title: 'Magna-Tiles Clear Colors 100 Piece Set',
    description: 'Award-winning magnetic building tiles for STEM learning and creative play.',
    image_url: 'https://m.media-amazon.com/images/I/81RJe4QFxnL._AC_SL1500_.jpg',
    price: 119.99,
    product_url: 'https://www.amazon.com/dp/B000CBSNRY',
    age_range: '3-5',
    category: 'toys',
    trending_score: 94,
  },
  // 6-8 Age Range
  {
    title: 'LEGO Classic Large Creative Brick Box',
    description: '790 pieces for unlimited building possibilities and creative expression.',
    image_url: 'https://m.media-amazon.com/images/I/91bJRLqHhVL._AC_SL1500_.jpg',
    price: 49.99,
    product_url: 'https://www.amazon.com/dp/B00NHQF6MG',
    age_range: '6-8',
    category: 'toys',
    trending_score: 97,
  },
  {
    title: 'National Geographic Break Open Geodes Kit',
    description: 'Discover crystals inside real geodes with this hands-on science kit.',
    image_url: 'https://m.media-amazon.com/images/I/81vKM+z1ZcL._AC_SL1500_.jpg',
    price: 29.99,
    product_url: 'https://www.amazon.com/dp/B016LNFGXY',
    age_range: '6-8',
    category: 'toys',
    trending_score: 93,
  },
  {
    title: 'Crayola Inspiration Art Case',
    description: '140 art supplies including crayons, colored pencils, and markers in a portable case.',
    image_url: 'https://m.media-amazon.com/images/I/91J6gsYvOaL._AC_SL1500_.jpg',
    price: 34.99,
    product_url: 'https://www.amazon.com/dp/B00UNBONZE',
    age_range: '6-8',
    category: 'arts-crafts',
    trending_score: 91,
  },
  // 9-12 Age Range
  {
    title: 'LEGO Technic McLaren Formula 1 Race Car',
    description: 'Build an authentic F1 car model with working features.',
    image_url: 'https://m.media-amazon.com/images/I/81XHST-IOML._AC_SL1500_.jpg',
    price: 179.99,
    product_url: 'https://www.amazon.com/dp/B09R25T1JZ',
    age_range: '9-12',
    category: 'toys',
    trending_score: 96,
  },
  {
    title: 'Nintendo Switch Lite',
    description: 'Portable gaming console perfect for playing on the go.',
    image_url: 'https://m.media-amazon.com/images/I/71d-XrP9y5L._SL1500_.jpg',
    price: 199.99,
    product_url: 'https://www.amazon.com/dp/B092VT1JGD',
    age_range: '9-12',
    category: 'electronics',
    trending_score: 99,
  },
  {
    title: 'Klutz LEGO Chain Reactions Craft Kit',
    description: 'Build 10 amazing moving machines with LEGO bricks and paper.',
    image_url: 'https://m.media-amazon.com/images/I/91TqnwclZRL._AC_SL1500_.jpg',
    price: 21.99,
    product_url: 'https://www.amazon.com/dp/0545703301',
    age_range: '9-12',
    category: 'toys',
    trending_score: 88,
  },
  // 13-18 Age Range
  {
    title: 'Apple AirPods Pro (2nd Generation)',
    description: 'Premium wireless earbuds with active noise cancellation.',
    image_url: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    price: 249.99,
    product_url: 'https://www.amazon.com/dp/B0CHWRXH8B',
    age_range: '13-18',
    category: 'electronics',
    trending_score: 98,
  },
  {
    title: 'Polaroid Now+ Gen 2 Instant Camera',
    description: 'Creative instant camera with Bluetooth connectivity and lens filters.',
    image_url: 'https://m.media-amazon.com/images/I/71gE+BbvUiL._AC_SL1500_.jpg',
    price: 149.99,
    product_url: 'https://www.amazon.com/dp/B0BZRZ4YQV',
    age_range: '13-18',
    category: 'electronics',
    trending_score: 94,
  },
  {
    title: 'Hydro Flask Water Bottle 32 oz',
    description: 'Insulated stainless steel water bottle in trendy colors.',
    image_url: 'https://m.media-amazon.com/images/I/51xplWVmW-L._AC_SL1000_.jpg',
    price: 44.95,
    product_url: 'https://www.amazon.com/dp/B083GD2Y8M',
    age_range: '13-18',
    category: 'other',
    trending_score: 92,
  },
];

// GET - Fetch trending gifts by age range and/or category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ageRange = searchParams.get('age_range') as AgeRange | null;
    const category = searchParams.get('category') as CollectionCategory | null;
    const limit = parseInt(searchParams.get('limit') || '12');

    const supabaseAdmin = getSupabaseAdmin();

    // Try to fetch from database first (if Supabase is available)
    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('trending_gifts')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (ageRange) {
        query = query.eq('age_range', ageRange);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data: dbGifts, error } = await query;

      // If we have database results, return them
      if (!error && dbGifts && dbGifts.length > 0) {
        return NextResponse.json({
          success: true,
          data: dbGifts,
          source: 'database',
        });
      }
    }

    // Otherwise, return curated data filtered appropriately
    let filteredGifts = [...CURATED_TRENDING_GIFTS];

    if (ageRange) {
      filteredGifts = filteredGifts.filter(g => g.age_range === ageRange);
    }
    if (category) {
      filteredGifts = filteredGifts.filter(g => g.category === category);
    }

    // Sort by trending score and limit
    filteredGifts = filteredGifts
      .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
      .slice(0, limit);

    // Add affiliate links and generate IDs
    const giftsWithAffiliates = filteredGifts.map((gift, index) => {
      const giftWithId = {
        ...gift,
        id: `curated-${gift.age_range}-${index}`,
        currency: 'USD',
        source: 'manual' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (gift.product_url) {
        const scrapedProduct = {
          title: gift.title || null,
          description: gift.description || null,
          image_url: gift.image_url || null,
          price: gift.price || null,
          currency: 'USD',
          retailer: 'amazon' as const,
          asin: null,
          original_url: gift.product_url,
          affiliate_url: null,
        };
        const withAffiliate = addAffiliateLink(scrapedProduct);
        return {
          ...giftWithId,
          affiliate_url: withAffiliate.affiliate_url,
        };
      }
      return giftWithId;
    });

    return NextResponse.json({
      success: true,
      data: giftsWithAffiliates,
      source: 'curated',
    });
  } catch (error) {
    console.error('Error fetching trending gifts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending gifts' },
      { status: 500 }
    );
  }
}

// POST - Scrape and add new trending gifts
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { urls, age_range, category } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (!age_range) {
      return NextResponse.json(
        { success: false, error: 'age_range is required' },
        { status: 400 }
      );
    }

    const results: TrendingGift[] = [];
    const errors: string[] = [];

    // Scrape each URL
    for (const url of urls.slice(0, 10)) { // Limit to 10 URLs per request
      try {
        const scraped = await scrapeProduct(url);
        const withAffiliate = addAffiliateLink(scraped);

        const trendingGift: Partial<TrendingGift> = {
          title: withAffiliate.title || 'Unknown Product',
          description: withAffiliate.description,
          image_url: withAffiliate.image_url,
          price: withAffiliate.price,
          currency: withAffiliate.currency,
          product_url: withAffiliate.original_url,
          affiliate_url: withAffiliate.affiliate_url,
          retailer: withAffiliate.retailer,
          age_range: age_range,
          category: category || 'other',
          source: 'manual',
          trending_score: 50, // Default score for manually added items
        };

        // Insert into database
        const { data, error } = await supabaseAdmin
          .from('trending_gifts')
          .insert([trendingGift])
          .select()
          .single();

        if (error) {
          errors.push(`Failed to save ${url}: ${error.message}`);
        } else if (data) {
          results.push(data as TrendingGift);
        }
      } catch (err) {
        errors.push(`Failed to scrape ${url}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully added ${results.length} trending gifts`,
    });
  } catch (error) {
    console.error('Error adding trending gifts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add trending gifts' },
      { status: 500 }
    );
  }
}

// PUT - Refresh trending gifts by scraping popular sources
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { age_range } = body;

    // For now, refresh from curated data
    // In production, this would trigger actual web scraping jobs
    const searchTerms = age_range
      ? AGE_SEARCH_TERMS[age_range as AgeRange]
      : Object.values(AGE_SEARCH_TERMS).flat();

    // Get gifts to refresh for this age range
    const giftsToRefresh = age_range
      ? CURATED_TRENDING_GIFTS.filter(g => g.age_range === age_range)
      : CURATED_TRENDING_GIFTS;

    const results: Partial<TrendingGift>[] = [];

    for (const gift of giftsToRefresh) {
      // Check if already exists in database
      const { data: existing } = await supabaseAdmin
        .from('trending_gifts')
        .select('id')
        .eq('product_url', gift.product_url)
        .single();

      if (!existing) {
        // Insert new gift
        const { data, error } = await supabaseAdmin
          .from('trending_gifts')
          .insert([{
            ...gift,
            source: 'manual',
            currency: 'USD',
          }])
          .select()
          .single();

        if (!error && data) {
          results.push(data);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed ${results.length} trending gifts`,
      data: results,
      search_terms_used: searchTerms.slice(0, 5),
    });
  } catch (error) {
    console.error('Error refreshing trending gifts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh trending gifts' },
      { status: 500 }
    );
  }
}
