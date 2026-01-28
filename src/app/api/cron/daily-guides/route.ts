import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createGuide, publishGuide } from "@/lib/guide-generator";
import { getTodaysTopic, shouldGenerateGuide } from "@/lib/topic-rotation";
import { discoverProductsForTopic } from "@/lib/product-discovery";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify cron secret for automated requests
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/daily-guides - Generate daily gift guides
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const results: Array<{ topic: string; status: string; guideId?: string; error?: string; productsDiscovered?: number }> = [];

  try {
    // Get today's topic based on day of week
    const topic = getTodaysTopic();
    console.log(`Daily guide generation starting for topic: ${topic.type} - ${topic.params.join(", ")}`);

    // Check if we should generate (avoid duplicates)
    const { data: recentGuides } = await supabase
      .from("gift_guides")
      .select("slug, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    // Generate guides for each param in today's topic
    for (const param of topic.params) {
      const topicKey = `${topic.type}-${param}`;

      // Check if similar guide was generated recently
      if (!shouldGenerateGuide(recentGuides || [], topicKey)) {
        results.push({
          topic: topicKey,
          status: "skipped",
          error: "Similar guide generated recently",
        });
        continue;
      }

      try {
        // Auto-discover products if needed
        console.log(`Checking/discovering products for ${topicKey}...`);
        const discoveredProducts = await discoverProductsForTopic(topic.type, [param]);

        if (discoveredProducts.length === 0) {
          results.push({
            topic: topicKey,
            status: "skipped",
            error: "No products available and discovery failed",
          });
          continue;
        }

        console.log(`Found ${discoveredProducts.length} products for ${topicKey}`);

        // Generate the guide using discovered products
        const productIds = discoveredProducts.map(p => p.id);
        const { guide, error, logId } = await createGuide(topic.type, [param], productIds);

        if (error || !guide) {
          results.push({
            topic: topicKey,
            status: "failed",
            error: error || "Unknown error",
            productsDiscovered: discoveredProducts.length,
          });
          continue;
        }

        // Auto-publish the guide
        const { success: publishSuccess, error: publishError } = await publishGuide(guide.id);

        if (!publishSuccess) {
          results.push({
            topic: topicKey,
            status: "created_not_published",
            guideId: guide.id,
            error: publishError || "Failed to publish",
            productsDiscovered: discoveredProducts.length,
          });
          continue;
        }

        results.push({
          topic: topicKey,
          status: "success",
          guideId: guide.id,
          productsDiscovered: discoveredProducts.length,
        });

        console.log(`Successfully generated and published guide: ${guide.title} (${guide.slug})`);
      } catch (genError) {
        console.error(`Error generating guide for ${topicKey}:`, genError);
        results.push({
          topic: topicKey,
          status: "error",
          error: genError instanceof Error ? genError.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed" || r.status === "error").length;

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} guides, ${failedCount} failed`,
      topic: `${topic.type}: ${topic.params.join(", ")}`,
      results,
    });
  } catch (error) {
    console.error("Daily guide cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
