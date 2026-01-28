import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Product, CreateProductInput, UpdateProductInput, AgeRange, CollectionCategory } from '@/lib/types';

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

// GET /api/products - List products
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ageRange = searchParams.get('age_range') as AgeRange | null;
    const category = searchParams.get('category') as CollectionCategory | null;
    const retailer = searchParams.get('retailer');
    const active = searchParams.get('active') !== 'false'; // Default to only active
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getServiceClient();

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (active) {
      query = query.eq('is_active', true);
    }

    if (ageRange) {
      query = query.eq('age_range', ageRange);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (retailer) {
      query = query.eq('retailer', retailer);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Products GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: data as Product[],
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create product (admin only)
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

    const body = await request.json();
    const {
      asin,
      title,
      description,
      image_url,
      price,
      original_url,
      affiliate_url,
      retailer = 'amazon',
      age_range,
      category,
      brand,
      rating,
      review_count,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!original_url?.trim()) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Check for duplicate ASIN if provided
    if (asin) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('asin', asin)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Product with this ASIN already exists', existing_id: existing.id },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        asin: asin || null,
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url || null,
        price: price || null,
        original_url: original_url.trim(),
        affiliate_url: affiliate_url || null,
        retailer: retailer || 'amazon',
        age_range: age_range || null,
        category: category || null,
        brand: brand?.trim() || null,
        rating: rating || null,
        review_count: review_count || null,
        is_active: true,
        last_scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Product create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products - Update product (admin only)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body: UpdateProductInput = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'title', 'description', 'image_url', 'price', 'original_url',
      'affiliate_url', 'retailer', 'age_range', 'category', 'brand',
      'rating', 'review_count', 'is_active', 'asin'
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = (body as unknown as Record<string, unknown>)[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products - Delete product (admin only)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Product delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
