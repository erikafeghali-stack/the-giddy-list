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
    const { kidId, registryId, title, image, price, url } = body;

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { error: "Missing required fields: title, url" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!kidId && !registryId) {
      return NextResponse.json(
        { error: "Must provide either kidId or registryId" },
        { status: 400, headers: corsHeaders }
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

    // If adding to a registry
    if (registryId) {
      // Verify the registry belongs to the user
      const { data: registry, error: regError } = await supabase
        .from("registries")
        .select("id, name, kid_id")
        .eq("id", registryId)
        .eq("user_id", user.id)
        .single();

      if (regError || !registry) {
        return NextResponse.json(
          { error: "Registry not found or unauthorized" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Create wishlist item first (registry items link to wishlists)
      const wishlistKidId = registry.kid_id || kidId;

      if (!wishlistKidId) {
        return NextResponse.json(
          { error: "Registry has no associated kid. Please provide kidId." },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check for duplicate URL in this kid's wishlist
      const { data: existingItem } = await supabase
        .from("wishlists")
        .select("id")
        .eq("kid_id", wishlistKidId)
        .eq("url", url)
        .maybeSingle();

      let wishlistItemId: string;

      if (existingItem) {
        // Item already exists as a wishlist item - just link it to the registry
        wishlistItemId = existingItem.id;
      } else {
        // Create new wishlist item
        const { data: newItem, error: insertError } = await supabase
          .from("wishlists")
          .insert({
            kid_id: wishlistKidId,
            user_id: user.id,
            title: title.substring(0, 500),
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
            { error: "Failed to add item" },
            { status: 500, headers: corsHeaders }
          );
        }

        wishlistItemId = newItem.id;
      }

      // Check if already linked to this registry
      const { data: existingLink } = await supabase
        .from("registry_items")
        .select("id")
        .eq("registry_id", registryId)
        .eq("wishlist_id", wishlistItemId)
        .maybeSingle();

      if (existingLink) {
        return NextResponse.json(
          { error: "This item is already in the registry" },
          { status: 409, headers: corsHeaders }
        );
      }

      // Get max display_order for this registry
      const { data: maxOrderResult } = await supabase
        .from("registry_items")
        .select("display_order")
        .eq("registry_id", registryId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderResult?.display_order ?? -1) + 1;

      // Link to registry
      const { error: linkError } = await supabase
        .from("registry_items")
        .insert({
          registry_id: registryId,
          wishlist_id: wishlistItemId,
          display_order: nextOrder,
        });

      if (linkError) {
        console.error("Registry link error:", linkError);
        return NextResponse.json(
          { error: "Failed to add item to registry" },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Added to ${registry.name}`,
          destination: "registry",
        },
        { headers: corsHeaders }
      );
    }

    // Adding to a kid's wishlist (original behavior)
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
      .maybeSingle();

    if (existingItem) {
      return NextResponse.json(
        { error: "This item is already on the wishlist" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Add item to wishlist
    const { data: newItem, error: insertError } = await supabase
      .from("wishlists")
      .insert({
        kid_id: kidId,
        user_id: user.id,
        title: title.substring(0, 500),
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
        destination: "wishlist",
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
