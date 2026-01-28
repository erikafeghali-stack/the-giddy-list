import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GiftGuide, AgeRange, CollectionCategory, GuideStatus } from '@/lib/types';

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

// GET /api/guides - List guides
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as GuideStatus | null;
    const ageRange = searchParams.get('age_range') as AgeRange | null;
    const category = searchParams.get('category') as CollectionCategory | null;
    const occasion = searchParams.get('occasion');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeAll = searchParams.get('include_all') === 'true';

    const supabase = getServiceClient();

    // Check if user is admin for non-published guides
    let isUserAdmin = false;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      isUserAdmin = await isAdmin(token);
    }

    // Build query
    let query = supabase
      .from('gift_guides')
      .select('*', { count: 'exact' });

    // Non-admins can only see published guides
    if (!isUserAdmin || (!includeAll && !status)) {
      query = query.eq('status', 'published');
    } else if (status) {
      query = query.eq('status', status);
    }

    if (ageRange) {
      query = query.eq('age_range', ageRange);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (occasion) {
      query = query.eq('occasion', occasion);
    }

    const { data, error, count } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Guides GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get product counts for each guide
    const guideIds = (data || []).map(g => g.id);
    let productCounts: Record<string, number> = {};

    if (guideIds.length > 0) {
      const { data: countData } = await supabase
        .from('gift_guide_products')
        .select('guide_id')
        .in('guide_id', guideIds);

      if (countData) {
        productCounts = countData.reduce((acc, item) => {
          acc[item.guide_id] = (acc[item.guide_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    const guides = (data || []).map(guide => ({
      ...guide,
      product_count: productCounts[guide.id] || 0,
    }));

    return NextResponse.json({
      guides,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Guides GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
