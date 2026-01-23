import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateRegistryInput } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/registry/[slug] - Get registry by slug (public or private)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // First, get the registry
    const { data: registry, error: registryError } = await supabase
      .from('registries')
      .select(`
        *,
        kids ( id, name )
      `)
      .eq('slug', slug)
      .single();

    if (registryError || !registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
    }

    // Check if user is owner (optional auth)
    let isOwner = false;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      isOwner = user?.id === registry.user_id;
    }

    // If not public and not owner, deny access
    if (!registry.is_public && !isOwner) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
    }

    // Get registry items with wishlist details
    const { data: registryItems, error: itemsError } = await supabase
      .from('registry_items')
      .select(`
        id,
        display_order,
        wishlists (
          id,
          title,
          url,
          image_url,
          description,
          price,
          currency,
          affiliate_url,
          retailer,
          status,
          quantity,
          quantity_claimed,
          notes
        )
      `)
      .eq('registry_id', registry.id)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching registry items:', itemsError);
    }

    // Transform items - filter out any with null wishlists (RLS blocked)
    const items = (registryItems || [])
      .filter((ri: any) => ri.wishlists && ri.wishlists.id)
      .map((ri: any) => ({
        ...ri.wishlists,
        display_order: ri.display_order,
      }));

    // If not owner and show_purchased is false, filter out purchased items
    const filteredItems = !isOwner && !registry.show_purchased
      ? items.filter((item: any) => item.status !== 'purchased')
      : items;

    // Get claims if owner
    let claims: any[] = [];
    if (isOwner) {
      const wishlistIds = items.map((i: any) => i.id);
      if (wishlistIds.length > 0) {
        const { data: claimsData } = await supabase
          .from('gift_claims')
          .select('*')
          .in('wishlist_id', wishlistIds);
        claims = claimsData || [];
      }
    }

    return NextResponse.json({
      registry: {
        ...registry,
        items: filteredItems,
      },
      isOwner,
      claims: isOwner ? claims : [],
    });
  } catch (error) {
    console.error('Registry GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/registry/[slug] - Update registry (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get registry to verify ownership
    const { data: registry, error: fetchError } = await supabase
      .from('registries')
      .select('id, user_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
    }

    if (registry.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: UpdateRegistryInput = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.occasion !== undefined) updateData.occasion = body.occasion?.trim() || null;
    if (body.event_date !== undefined) updateData.event_date = body.event_date || null;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (body.show_prices !== undefined) updateData.show_prices = body.show_prices;
    if (body.show_purchased !== undefined) updateData.show_purchased = body.show_purchased;
    if (body.allow_anonymous_claims !== undefined) updateData.allow_anonymous_claims = body.allow_anonymous_claims;
    if (body.kid_id !== undefined) updateData.kid_id = body.kid_id || null;

    const { data, error } = await supabase
      .from('registries')
      .update(updateData)
      .eq('id', registry.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registry: data });
  } catch (error) {
    console.error('Registry PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/registry/[slug] - Delete registry (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('registries')
      .delete()
      .eq('slug', slug)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registry DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
