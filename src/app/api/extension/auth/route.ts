import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// CORS headers for extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { isLoggedIn: false, kids: [], error: "Server configuration error" },
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
        { isLoggedIn: false, kids: [] },
        { headers: corsHeaders }
      );
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return NextResponse.json(
        { isLoggedIn: false, kids: [] },
        { headers: corsHeaders }
      );
    }

    // Get user's kids
    const { data: kids, error: kidsError } = await supabase
      .from("kids")
      .select("id, name, birthdate, avatar_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (kidsError) {
      console.error("Error fetching kids:", kidsError);
      return NextResponse.json(
        { isLoggedIn: true, kids: [] },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        isLoggedIn: true,
        userId: user.id,
        email: user.email,
        kids: kids || [],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Extension auth error:", error);
    return NextResponse.json(
      { isLoggedIn: false, kids: [], error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
