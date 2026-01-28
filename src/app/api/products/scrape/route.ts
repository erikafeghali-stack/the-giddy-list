import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeProduct, normalizeUrl } from '@/lib/scraper';
import { addAffiliateLink } from '@/lib/affiliate';
import { Product, AgeRange, CollectionCategory } from '@/lib/types';

// Use service role for product management
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Get anon client for auth checks
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Check if user is admin
async function isAdmin(token: string): Promise<boolean> {
  const supabase = getAnonClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return false;

  const serviceClient = getServiceClient();
  const { data: profile } = await serviceClient
    .from('creator_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.is_admin === true;
}

interface ScrapeAndSaveRequest {
  url: string;
  age_range?: AgeRange;
  category?: CollectionCategory;
  brand?: string;
}

// POST /api/products/scrape - Scrape product data and save to database
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body: ScrapeAndSaveRequest = await request.json();
    const { url, age_range, category, brand } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Normalize and scrape the URL
    const normalizedUrl = normalizeUrl(url);
    const scrapedData = await scrapeProduct(normalizedUrl);

    // Add affiliate link
    const productWithAffiliate = addAffiliateLink(scrapedData);

    const supabase = getServiceClient();

    // Check if product already exists by ASIN
    if (productWithAffiliate.asin) {
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('asin', productWithAffiliate.asin)
        .maybeSingle();

      if (existing) {
        // Update existing product with fresh data
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update({
            title: productWithAffiliate.title || existing.title,
            description: productWithAffiliate.description || existing.description,
            image_url: productWithAffiliate.image_url || existing.image_url,
            price: productWithAffiliate.price ?? existing.price,
            affiliate_url: productWithAffiliate.affiliate_url || existing.affiliate_url,
            last_scraped_at: new Date().toISOString(),
            // Update metadata if provided
            ...(age_range && { age_range }),
            ...(category && { category }),
            ...(brand && { brand }),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('Product update error:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
          product: updated as Product,
          action: 'updated',
          message: 'Existing product updated with fresh data',
        });
      }
    }

    // Create new product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        asin: productWithAffiliate.asin,
        title: productWithAffiliate.title || 'Untitled Product',
        description: productWithAffiliate.description,
        image_url: productWithAffiliate.image_url,
        price: productWithAffiliate.price,
        original_url: productWithAffiliate.original_url,
        affiliate_url: productWithAffiliate.affiliate_url,
        retailer: productWithAffiliate.retailer,
        age_range: age_range || null,
        category: category || null,
        brand: brand || null,
        is_active: true,
        last_scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Product insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      product: newProduct as Product,
      action: 'created',
      message: 'New product created from scraped data',
    }, { status: 201 });
  } catch (error) {
    console.error('Product scrape error:', error);
    return NextResponse.json({ error: 'Failed to scrape and save product' }, { status: 500 });
  }
}
