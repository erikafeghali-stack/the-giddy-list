import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productUrl = searchParams.get("url");
    const guideId = searchParams.get("guide");
    const sourceType = searchParams.get("source");
    const sourceId = searchParams.get("sid");

    if (!productUrl) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Get Supabase client with service role for tracking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey && guideId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Hash IP for privacy
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0] : "unknown";
      const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);

      // Generate visitor ID from IP hash + user agent
      const userAgent = request.headers.get("user-agent") || "";
      const visitorId = crypto
        .createHash("sha256")
        .update(ipHash + userAgent)
        .digest("hex")
        .substring(0, 32);

      // Extract retailer from URL
      let retailer = "other";
      try {
        const urlObj = new URL(productUrl);
        const hostname = urlObj.hostname.toLowerCase();
        if (hostname.includes("amazon")) retailer = "amazon";
        else if (hostname.includes("target")) retailer = "target";
        else if (hostname.includes("walmart")) retailer = "walmart";
        else retailer = hostname.replace("www.", "");
      } catch {
        // Keep default
      }

      // Log the click
      await supabase.from("affiliate_clicks").insert({
        guide_id: guideId,
        visitor_id: visitorId,
        source_type: sourceType || "collection",
        source_id: sourceId || null,
        product_url: productUrl,
        retailer: retailer,
        ip_hash: ipHash,
        user_agent: userAgent.substring(0, 500),
        referer: request.headers.get("referer") || null,
      });
    }

    // Generate affiliate URL if we have one
    // For now, just redirect to the original URL
    // In the future, this would convert to an affiliate link
    let affiliateUrl = productUrl;

    // Example: Convert Amazon URL to affiliate link
    // This would use your Amazon Associates tag
    if (productUrl.includes("amazon.com")) {
      const amazonTag = process.env.AMAZON_AFFILIATE_TAG;
      if (amazonTag) {
        const url = new URL(productUrl);
        url.searchParams.set("tag", amazonTag);
        affiliateUrl = url.toString();
      }
    }

    // Redirect to the product page
    return NextResponse.redirect(affiliateUrl);
  } catch (error) {
    console.error("Click tracking error:", error);
    // On error, still try to redirect to the URL
    const url = request.nextUrl.searchParams.get("url");
    if (url) {
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}
