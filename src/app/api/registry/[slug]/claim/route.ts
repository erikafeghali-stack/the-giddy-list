import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ClaimRequest, ClaimResponse } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/registry/[slug]/claim - Claim an item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ClaimResponse>> {
  try {
    const { slug } = await params;
    const body: ClaimRequest = await request.json();

    if (!body.wishlist_id) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item ID is required' },
        { status: 400 }
      );
    }

    // Get registry by slug
    const { data: registry, error: registryError } = await supabase
      .from('registries')
      .select('id, is_public, allow_anonymous_claims, user_id')
      .eq('slug', slug)
      .single();

    if (registryError || !registry) {
      return NextResponse.json(
        { success: false, error: 'Registry not found' },
        { status: 404 }
      );
    }

    if (!registry.is_public) {
      return NextResponse.json(
        { success: false, error: 'Registry is not public' },
        { status: 403 }
      );
    }

    // Check if item exists in registry
    const { data: registryItem, error: itemError } = await supabase
      .from('registry_items')
      .select('id, wishlist_id')
      .eq('registry_id', registry.id)
      .eq('wishlist_id', body.wishlist_id)
      .single();

    if (itemError || !registryItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found in registry' },
        { status: 404 }
      );
    }

    // Get the wishlist item to check availability
    const { data: wishlistItem, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id, quantity, quantity_claimed, status')
      .eq('id', body.wishlist_id)
      .single();

    if (wishlistError || !wishlistItem) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    const requestedQty = body.quantity || 1;
    const availableQty = wishlistItem.quantity - wishlistItem.quantity_claimed;

    if (availableQty < requestedQty) {
      return NextResponse.json(
        { success: false, error: 'Not enough quantity available' },
        { status: 400 }
      );
    }

    // Get user if authenticated
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Require name/email for anonymous claims if enabled
    if (!userId && registry.allow_anonymous_claims) {
      if (!body.guest_name?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Name is required' },
          { status: 400 }
        );
      }
    } else if (!userId && !registry.allow_anonymous_claims) {
      return NextResponse.json(
        { success: false, error: 'Login required to claim items' },
        { status: 401 }
      );
    }

    // Create the claim
    const { data: claim, error: claimError } = await supabase
      .from('gift_claims')
      .insert({
        wishlist_id: body.wishlist_id,
        registry_id: registry.id,
        user_id: userId,
        guest_name: body.guest_name?.trim() || null,
        guest_email: body.guest_email?.trim() || null,
        claim_type: body.claim_type || 'reserved',
        quantity: requestedQty,
        note: body.note?.trim() || null,
        purchased_at: body.claim_type === 'purchased' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (claimError) {
      console.error('Claim error:', claimError);
      return NextResponse.json(
        { success: false, error: 'Failed to create claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error('Claim POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/registry/[slug]/claim - Remove a claim (owner or claimer only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claim_id');

    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the claim
    const { data: claim, error: claimError } = await supabase
      .from('gift_claims')
      .select('id, user_id, registry_id')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Get the registry to check ownership
    const { data: registry } = await supabase
      .from('registries')
      .select('user_id')
      .eq('slug', slug)
      .single();

    // Allow delete if user is the claimer or the registry owner
    const isOwner = registry?.user_id === user.id;
    const isClaimer = claim.user_id === user.id;

    if (!isOwner && !isClaimer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('gift_claims')
      .delete()
      .eq('id', claimId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Claim DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
