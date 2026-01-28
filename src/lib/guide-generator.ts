import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import {
  Product,
  GiftGuide,
  AIGuideContent,
  GuideTopicType,
  AgeRange,
  CollectionCategory,
} from './types';
import { generateGuideTopic, AGE_RANGE_NAMES, CATEGORY_NAMES } from './topic-rotation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// System prompt for guide generation
const SYSTEM_PROMPT = `You are a gift guide writer for The Giddy List, a trusted platform for parents seeking quality gift recommendations for their children.

Your writing style is:
- Warm and parent-friendly, like advice from a knowledgeable friend
- SEO-optimized with natural keyword usage
- Helpful and practical with specific recommendations
- Concise but engaging

When generating gift guide content, you MUST return valid JSON with this exact structure:
{
  "title": "Catchy, SEO-friendly title (50-60 chars ideal)",
  "metaDescription": "Compelling meta description with keywords (150-160 chars)",
  "introContent": "2-3 paragraph introduction explaining who this guide is for and why these products were selected. Include natural mentions of key search terms.",
  "productDescriptions": [
    {
      "productId": "UUID of the product",
      "description": "2-3 sentences about why this product is great. Focus on features, benefits, and age-appropriateness.",
      "highlightReason": "One sentence about what makes this product stand out (e.g., 'Best value', 'Editor's pick', 'Most popular')"
    }
  ],
  "keywords": ["array", "of", "5-10", "SEO", "keywords"],
  "suggestedSlug": "url-friendly-slug-no-timestamp"
}

Important guidelines:
- Never recommend anything unsafe or inappropriate for the target age group
- Be honest about product value and use cases
- Focus on quality and educational value when applicable
- Keep descriptions specific and actionable
- Make the intro conversational but informative`;

// Build the user prompt based on topic and products
function buildUserPrompt(
  topicType: GuideTopicType,
  topicParams: string[],
  products: Product[]
): string {
  let prompt = 'Generate a gift guide with the following context:\n\n';

  // Topic context
  switch (topicType) {
    case 'age':
      const ageRanges = topicParams.map(p => AGE_RANGE_NAMES[p as AgeRange] || p).join(' and ');
      prompt += `Target Age Group: ${ageRanges}\n`;
      prompt += `Focus on age-appropriate gifts that support development and bring joy.\n\n`;
      break;

    case 'category':
      const categories = topicParams.map(p => CATEGORY_NAMES[p as CollectionCategory] || p).join(' and ');
      prompt += `Category Focus: ${categories}\n`;
      prompt += `Highlight the best options in this category across different price points.\n\n`;
      break;

    case 'occasion':
      prompt += `Occasion: ${topicParams.join(', ')}\n`;
      prompt += `Create a guide perfect for gift-givers shopping for this occasion.\n\n`;
      break;

    case 'seasonal':
      prompt += `Season/Theme: ${topicParams.join(', ')}\n`;
      prompt += `Focus on timely, relevant gift ideas for this season.\n\n`;
      break;
  }

  // Product list
  prompt += `Products to feature (include all in your descriptions):\n\n`;

  products.forEach((product, index) => {
    prompt += `${index + 1}. ID: ${product.id}\n`;
    prompt += `   Title: ${product.title}\n`;
    prompt += `   Price: ${product.price ? `$${product.price}` : 'Price varies'}\n`;
    prompt += `   Category: ${product.category || 'General'}\n`;
    prompt += `   Age Range: ${product.age_range || 'All ages'}\n`;
    if (product.description) {
      prompt += `   Description: ${product.description.slice(0, 200)}...\n`;
    }
    prompt += '\n';
  });

  prompt += `\nGenerate the gift guide content as valid JSON. Include all ${products.length} products in productDescriptions with their exact product IDs.`;

  return prompt;
}

// Generate guide content using OpenAI
export async function generateGuideContent(
  topicType: GuideTopicType,
  topicParams: string[],
  products: Product[]
): Promise<{ content: AIGuideContent; tokensUsed: number }> {
  const userPrompt = buildUserPrompt(topicType, topicParams, products);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  const tokensUsed = completion.usage?.total_tokens || 0;

  // Parse JSON response
  let content: AIGuideContent;
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Response text:', responseText);

    // Generate fallback content
    const topicInfo = generateGuideTopic(topicType, topicParams);
    content = {
      title: topicInfo.title,
      metaDescription: `Discover the best gift ideas ${topicParams.join(' and ')}. Hand-picked recommendations from The Giddy List.`,
      introContent: `Finding the perfect gift can be challenging, but we're here to help. This guide features our top picks based on quality, value, and age-appropriateness.\n\nEach item has been carefully selected to bring joy and create lasting memories.`,
      productDescriptions: products.map(p => ({
        productId: p.id,
        description: p.description || `${p.title} is a wonderful choice for any gift list.`,
        highlightReason: 'Featured pick',
      })),
      keywords: [topicType, ...topicParams, 'gift guide', 'kids gifts', 'best gifts'],
      suggestedSlug: topicInfo.slug.replace(/-\d{8}$/, ''),
    };
  }

  return { content, tokensUsed };
}

// Create a complete guide in the database
export async function createGuide(
  topicType: GuideTopicType,
  topicParams: string[],
  productIds?: string[]
): Promise<{ guide: GiftGuide | null; error: string | null; logId: string }> {
  const supabase = getServiceClient();

  // Create initial log entry
  const { data: logEntry, error: logError } = await supabase
    .from('guide_generation_logs')
    .insert({
      topic_type: topicType,
      topic_params: { params: topicParams },
      status: 'started',
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create log entry:', logError);
    return { guide: null, error: 'Failed to initialize generation', logId: '' };
  }

  const logId = logEntry.id;

  try {
    // Get products to feature
    let products: Product[];

    if (productIds && productIds.length > 0) {
      // Use specified products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (error || !data || data.length === 0) {
        throw new Error('Failed to fetch specified products');
      }
      products = data;
    } else {
      // Auto-select products based on topic
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (topicType === 'age' && topicParams.length > 0) {
        query = query.in('age_range', topicParams);
      }

      if (topicType === 'category' && topicParams.length > 0) {
        query = query.in('category', topicParams);
      }

      const { data, error } = await query.limit(10);

      if (error || !data || data.length === 0) {
        throw new Error('No products available for this topic');
      }
      products = data;
    }

    // Generate topic info
    const topicInfo = generateGuideTopic(topicType, topicParams);

    // Generate AI content
    const { content, tokensUsed } = await generateGuideContent(topicType, topicParams, products);

    // Create the guide
    const { data: guide, error: guideError } = await supabase
      .from('gift_guides')
      .insert({
        slug: content.suggestedSlug || topicInfo.slug,
        title: content.title || topicInfo.title,
        meta_description: content.metaDescription,
        intro_content: content.introContent,
        occasion: topicInfo.occasion,
        age_range: topicInfo.ageRange,
        category: topicInfo.category,
        keywords: content.keywords,
        status: 'draft',
        cover_image_url: products[0]?.image_url || null,
      })
      .select()
      .single();

    if (guideError) {
      // Check if slug conflict, try with timestamp
      if (guideError.code === '23505') {
        const timestamp = Date.now().toString(36);
        const newSlug = `${content.suggestedSlug || topicInfo.slug}-${timestamp}`;

        const { data: retryGuide, error: retryError } = await supabase
          .from('gift_guides')
          .insert({
            slug: newSlug,
            title: content.title || topicInfo.title,
            meta_description: content.metaDescription,
            intro_content: content.introContent,
            occasion: topicInfo.occasion,
            age_range: topicInfo.ageRange,
            category: topicInfo.category,
            keywords: content.keywords,
            status: 'draft',
            cover_image_url: products[0]?.image_url || null,
          })
          .select()
          .single();

        if (retryError) {
          throw new Error(`Failed to create guide: ${retryError.message}`);
        }

        // Continue with retry guide
        const createdGuide = retryGuide as GiftGuide;

        // Add products to guide
        await addProductsToGuide(supabase, createdGuide.id, products, content.productDescriptions);

        // Update log
        await supabase
          .from('guide_generation_logs')
          .update({
            guide_id: createdGuide.id,
            status: 'completed',
            tokens_used: tokensUsed,
          })
          .eq('id', logId);

        return { guide: createdGuide, error: null, logId };
      }

      throw new Error(`Failed to create guide: ${guideError.message}`);
    }

    const createdGuide = guide as GiftGuide;

    // Add products to guide
    await addProductsToGuide(supabase, createdGuide.id, products, content.productDescriptions);

    // Update log
    await supabase
      .from('guide_generation_logs')
      .update({
        guide_id: createdGuide.id,
        status: 'completed',
        tokens_used: tokensUsed,
      })
      .eq('id', logId);

    return { guide: createdGuide, error: null, logId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Guide generation error:', error);

    // Update log with error
    await supabase
      .from('guide_generation_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', logId);

    return { guide: null, error: errorMessage, logId };
  }
}

// Helper to add products to a guide
async function addProductsToGuide(
  supabase: ReturnType<typeof getServiceClient>,
  guideId: string,
  products: Product[],
  descriptions: AIGuideContent['productDescriptions']
) {
  const guideProducts = products.map((product, index) => {
    const desc = descriptions.find(d => d.productId === product.id);
    return {
      guide_id: guideId,
      product_id: product.id,
      display_order: index,
      ai_description: desc?.description || null,
      highlight_reason: desc?.highlightReason || null,
    };
  });

  const { error } = await supabase
    .from('gift_guide_products')
    .insert(guideProducts);

  if (error) {
    console.error('Failed to add products to guide:', error);
  }
}

// Publish a guide
export async function publishGuide(guideId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('gift_guides')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', guideId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Get guide by slug with products
export async function getGuideBySlug(slug: string): Promise<{
  guide: GiftGuide | null;
  products: Array<Product & { ai_description: string | null; highlight_reason: string | null; display_order: number }>;
}> {
  const supabase = getServiceClient();

  const { data: guide, error } = await supabase
    .from('gift_guides')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !guide) {
    return { guide: null, products: [] };
  }

  const { data: guideProducts } = await supabase
    .from('gift_guide_products')
    .select(`
      display_order,
      ai_description,
      highlight_reason,
      products (*)
    `)
    .eq('guide_id', guide.id)
    .order('display_order');

  const products = (guideProducts || []).map(gp => ({
    ...(gp.products as unknown as Product),
    ai_description: gp.ai_description,
    highlight_reason: gp.highlight_reason,
    display_order: gp.display_order,
  }));

  return { guide: guide as GiftGuide, products };
}
