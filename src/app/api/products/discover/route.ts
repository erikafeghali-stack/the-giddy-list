import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { discoverProducts, discoverProductsForAllAges } from '@/lib/product-discovery';
import { AgeRange, CollectionCategory } from '@/lib/types';

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

// POST /api/products/discover - AI-powered product discovery
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check - admin or cron secret
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && token === cronSecret;

    if (!isCron && !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { age_range, category, count = 10, discover_all = false } = body;

    if (discover_all) {
      // Discover for all age ranges
      const result = await discoverProductsForAllAges(
        category ? [category as CollectionCategory] : undefined
      );

      return NextResponse.json({
        success: true,
        message: `Discovered ${result.totalNew} new products (${result.totalSkipped} already existed)`,
        ...result,
      });
    }

    if (!age_range) {
      return NextResponse.json(
        { error: 'age_range is required (or set discover_all: true)' },
        { status: 400 }
      );
    }

    const result = await discoverProducts(
      age_range as AgeRange,
      category as CollectionCategory | undefined,
      count
    );

    return NextResponse.json({
      success: true,
      message: `Discovered ${result.newCount} new products (${result.skippedCount} already existed)`,
      products: result.products,
      newCount: result.newCount,
      skippedCount: result.skippedCount,
    });
  } catch (error) {
    console.error('Product discovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
