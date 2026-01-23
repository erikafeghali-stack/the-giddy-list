import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Registry, CreateRegistryInput } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate URL-safe slug from name
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

// GET /api/registry - List user's registries
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('registries')
      .select(`
        *,
        kids ( id, name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registries: data });
  } catch (error) {
    console.error('Registry GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/registry - Create new registry
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRegistryInput = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug if not provided
    let slug = body.slug?.trim() || generateSlug(body.name);

    // Check if slug is unique
    const { data: existing } = await supabase
      .from('registries')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      // Regenerate with different suffix
      slug = generateSlug(body.name);
    }

    const { data, error } = await supabase
      .from('registries')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        slug,
        kid_id: body.kid_id || null,
        description: body.description?.trim() || null,
        occasion: body.occasion?.trim() || null,
        event_date: body.event_date || null,
        is_public: body.is_public ?? true,
        show_prices: body.show_prices ?? true,
        show_purchased: body.show_purchased ?? false,
        allow_anonymous_claims: body.allow_anonymous_claims ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registry: data }, { status: 201 });
  } catch (error) {
    console.error('Registry POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
