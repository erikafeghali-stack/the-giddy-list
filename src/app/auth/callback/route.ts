import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  // Create response with redirect
  const response = NextResponse.redirect(new URL("/my-kids", url.origin));

  // Set cookie with access token for Chrome extension
  // Cookie expires when the access token expires (default 1 hour, but Supabase auto-refreshes)
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  response.cookies.set("sb-access-token", data.session.access_token, {
    httpOnly: false, // Extension needs to read it
    secure: true,
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  });

  // Also set refresh token for longer sessions
  response.cookies.set("sb-refresh-token", data.session.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  });

  return response;
}
