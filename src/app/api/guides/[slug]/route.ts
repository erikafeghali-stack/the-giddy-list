import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGuideBySlug, publishGuide } from '@/lib/guide-generator';
import { GiftGuide, UpdateGuideInput } from '@/lib/types';

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

// GET /api/guides/[slug] - Get guide by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { guide, products } = await getGuideBySlug(slug);

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Check if user is admin for draft guides
    if (guide.status !== 'published') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!(await isAdmin(token))) {
        return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
      }
    }

    // Increment view count for published guides
    if (guide.status === 'published') {
      const supabase = getServiceClient();
      await supabase.rpc('increment_guide_view_count', { guide_slug: slug });
    }

    return NextResponse.json({ guide, products });
  } catch (error) {
    console.error('Guide GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/guides/[slug] - Update guide
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { slug } = await params;
    const body = await request.json();

    const supabase = getServiceClient();

    // Get the guide first
    const { data: existingGuide, error: fetchError } = await supabase
      .from('gift_guides')
      .select('id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingGuide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'title', 'meta_description', 'intro_content', 'occasion',
      'age_range', 'category', 'keywords', 'cover_image_url', 'status'
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Handle status change to published
    if (body.status === 'published') {
      const { success, error } = await publishGuide(existingGuide.id);
      if (!success) {
        return NextResponse.json({ error: error || 'Failed to publish' }, { status: 500 });
      }
    } else if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('gift_guides')
        .update(updateData)
        .eq('id', existingGuide.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Fetch updated guide
    const { guide, products } = await getGuideBySlug(slug);

    return NextResponse.json({ guide, products });
  } catch (error) {
    console.error('Guide PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/guides/[slug] - Archive guide
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!(await isAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { slug } = await params;
    const supabase = getServiceClient();

    // Archive the guide (soft delete)
    const { error } = await supabase
      .from('gift_guides')
      .update({ status: 'archived' })
      .eq('slug', slug);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Guide DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
