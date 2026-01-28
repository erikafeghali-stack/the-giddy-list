import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGuide, publishGuide } from '@/lib/guide-generator';
import { GenerateGuideRequest, GuideTopicType } from '@/lib/types';

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

// Verify cron secret for automated requests
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// POST /api/guides/generate - Generate a new guide
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authorization - either admin user or cron secret
    const authHeader = request.headers.get('authorization');
    const isCron = verifyCronSecret(request);

    if (!isCron) {
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!(await isAdmin(token))) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    const body: GenerateGuideRequest = await request.json();
    const { topic_type, topic_params, product_ids } = body;

    // Validate topic type
    const validTopicTypes: GuideTopicType[] = ['age', 'category', 'occasion', 'seasonal'];
    if (!validTopicTypes.includes(topic_type)) {
      return NextResponse.json(
        { error: `Invalid topic_type. Must be one of: ${validTopicTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!topic_params || !Array.isArray(topic_params) || topic_params.length === 0) {
      return NextResponse.json(
        { error: 'topic_params is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Generate the guide
    const { guide, error, logId } = await createGuide(topic_type, topic_params, product_ids);

    if (error || !guide) {
      return NextResponse.json(
        { error: error || 'Failed to generate guide', logId },
        { status: 500 }
      );
    }

    // Auto-publish if this is a cron job
    if (isCron) {
      await publishGuide(guide.id);
      guide.status = 'published';
      guide.published_at = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      guide,
      logId,
      message: isCron ? 'Guide generated and published' : 'Guide generated as draft',
    }, { status: 201 });
  } catch (error) {
    console.error('Guide generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
