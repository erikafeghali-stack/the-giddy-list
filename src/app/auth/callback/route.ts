import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  console.log("Auth callback hit, code:", code ? "present" : "missing");

  if (!code) {
    console.log("No code, redirecting to login");
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("Exchange result - error:", error?.message, "session:", data?.session ? "present" : "missing");

  if (error || !data.session) {
    console.log("Auth error, redirecting to login");
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const userId = data.session.user.id;

  // Ensure creator_profiles row exists (needed for list URLs /list/username/kidname and onboarding)
  const { data: existingProfile } = await supabase
    .from("creator_profiles")
    .select("id, onboarding_completed")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    // Create default profile with unique username so /list/username/kidname works
    const baseUsername = "user-" + userId.replace(/-/g, "").slice(0, 12);
    const displayName =
      data.session.user.user_metadata?.full_name ??
      data.session.user.email?.split("@")[0] ??
      "User";
    const { error: insertError } = await supabase.from("creator_profiles").insert({
      id: userId,
      username: baseUsername,
      display_name: displayName,
      is_public: true,
    });
    if (insertError?.code === "23505") {
      // Unique violation: username taken, retry with suffix
      const fallbackUsername = baseUsername + "-" + Math.random().toString(36).slice(2, 8);
      await supabase.from("creator_profiles").insert({
        id: userId,
        username: fallbackUsername,
        display_name: displayName,
        is_public: true,
      });
    }
  }

  // Check if user has completed onboarding (re-fetch in case we just created profile)
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  // If onboarding not completed, redirect to onboarding
  if (!profile?.onboarding_completed) {
    console.log("Onboarding not completed, redirecting to /onboarding");
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  console.log("Returning user, redirecting to /dashboard");
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
