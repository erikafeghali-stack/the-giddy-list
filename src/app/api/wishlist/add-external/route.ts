import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// CORS headers for extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Try to get auth token from Authorization header first
    const authHeader = request.headers.get("Authorization");
    let authToken = authHeader?.replace("Bearer ", "");

    // Fallback to cookie
    if (!authToken) {
      const cookieStore = await cookies();
      authToken = cookieStore.get("sb-access-token")?.value;
    }

    if (!authToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { kidId, title, image, price, url } = body;

    // Validate required fields
    if (!kidId || !title || !url) {
      return NextResponse.json(
        { error: "Missing required fields: kidId, title, url" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the kid belongs to the user
    const { data: kid, error: kidError } = await supabase
      .from("kids")
      .select("id, name")
      .eq("id", kidId)
      .eq("user_id", user.id)
      .single();

    if (kidError || !kid) {
      return NextResponse.json(
        { error: "Kid not found or unauthorized" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if this URL already exists in the kid's wishlist
    const { data: existingItem } = await supabase
      .from("wishlists")
      .select("id")
      .eq("kid_id", kidId)
      .eq("url", url)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: "This item is already on the wishlist" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Parse price to decimal
    let parsedPrice = null;
    if (price) {
      const priceNum = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(priceNum) && priceNum > 0) {
        parsedPrice = priceNum;
      }
    }

    // Extract domain from URL for source tracking
    let source = "external";
    try {
      const urlObj = new URL(url);
      source = urlObj.hostname.replace("www.", "");
    } catch (e) {
      // Keep default source
    }

    // Add item to wishlist
    const { data: newItem, error: insertError } = await supabase
      .from("wishlists")
      .insert({
        kid_id: kidId,
        user_id: user.id,
        title: title.substring(0, 500), // Limit title length
        image_url: image || null,
        price: parsedPrice,
        url: url,
        original_url: url,
        retailer: source,
        status: "available",
        priority: 0,
        quantity: 1,
        quantity_claimed: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to add item to wishlist" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        item: newItem,
        message: `Added to ${kid.name}'s wishlist`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Add external item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
