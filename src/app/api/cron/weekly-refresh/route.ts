import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/scraper";
import { addAffiliateLink } from "@/lib/affiliate";
import { Product } from "@/lib/types";

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

// GET /api/cron/weekly-refresh - Refresh product data
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  try {
    console.log("Weekly product refresh starting...");

    // Get products that need refreshing (not scraped in last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleProducts, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`last_scraped_at.is.null,last_scraped_at.lt.${oneWeekAgo}`)
      .limit(50); // Limit to prevent timeout

    if (fetchError) {
      console.error("Error fetching stale products:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!staleProducts || staleProducts.length === 0) {
      console.log("No products need refreshing");
      return NextResponse.json({
        success: true,
        message: "No products need refreshing",
        updated: 0,
        failed: 0,
      });
    }

    console.log(`Found ${staleProducts.length} products to refresh`);

    let updated = 0;
    let failed = 0;
    let deactivated = 0;
    const errors: Array<{ productId: string; error: string }> = [];

    // Process products in batches to avoid rate limiting
    for (const product of staleProducts as Product[]) {
      try {
        // Add a small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Re-scrape the product
        const scrapedData = await scrapeProduct(product.original_url);
        const productWithAffiliate = addAffiliateLink(scrapedData);

        // Check if product is still available
        if (!productWithAffiliate.title && !productWithAffiliate.price) {
          // Product might be unavailable - mark as inactive
          await supabase
            .from("products")
            .update({
              is_active: false,
              last_scraped_at: new Date().toISOString(),
            })
            .eq("id", product.id);

          deactivated++;
          console.log(`Deactivated unavailable product: ${product.id}`);
          continue;
        }

        // Update the product with fresh data
        const updateData: Partial<Product> = {
          last_scraped_at: new Date().toISOString(),
        };

        // Only update fields that have new values
        if (productWithAffiliate.title) {
          updateData.title = productWithAffiliate.title;
        }
        if (productWithAffiliate.price !== null) {
          updateData.price = productWithAffiliate.price;
        }
        if (productWithAffiliate.image_url) {
          updateData.image_url = productWithAffiliate.image_url;
        }
        if (productWithAffiliate.description) {
          updateData.description = productWithAffiliate.description;
        }
        if (productWithAffiliate.affiliate_url) {
          updateData.affiliate_url = productWithAffiliate.affiliate_url;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", product.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        updated++;
        console.log(`Updated product: ${product.title} (${product.id})`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ productId: product.id, error: errorMessage });
        console.error(`Failed to refresh product ${product.id}:`, errorMessage);

        // Update last_scraped_at even on failure to prevent retry loop
        await supabase
          .from("products")
          .update({ last_scraped_at: new Date().toISOString() })
          .eq("id", product.id);
      }
    }

    console.log(`Weekly refresh complete: ${updated} updated, ${failed} failed, ${deactivated} deactivated`);

    return NextResponse.json({
      success: true,
      message: `Refresh complete`,
      total: staleProducts.length,
      updated,
      failed,
      deactivated,
      ...(errors.length > 0 && { errors: errors.slice(0, 10) }), // Include first 10 errors
    });
  } catch (error) {
    console.error("Weekly refresh cron error:", error);
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
