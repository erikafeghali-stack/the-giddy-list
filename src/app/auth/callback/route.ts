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

  console.log("Success, redirecting to /dashboard");

  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
