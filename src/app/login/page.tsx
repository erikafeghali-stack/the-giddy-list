"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/my-kids");
    });
  }, [router]);

  async function sendMagicLink() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-8 py-20 md:py-32">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <Link href="/">
            <h1
              className="text-5xl md:text-6xl font-black text-red tracking-tighter"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              The Giddy List
            </h1>
          </Link>
          <p className="mt-4 text-lg text-foreground/50">
            Wishlists & registries for your little ones
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white border border-gray-200 p-10 shadow-sm">
          <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
          <p className="mt-2 text-foreground/50">
            We'll email you a magic link. No password needed.
          </p>

          <input
            type="email"
            className="mt-8 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-foreground placeholder:text-foreground/40 focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            onKeyDown={(e) => e.key === "Enter" && email && !loading && sendMagicLink()}
          />

          <button
            className="mt-5 w-full rounded-2xl bg-red px-6 py-4 text-lg font-semibold text-white transition-all duration-200 hover:bg-red-hover hover:shadow-lg hover:shadow-red/20 disabled:opacity-50 disabled:hover:shadow-none"
            onClick={sendMagicLink}
            disabled={!email || loading}
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-sm text-foreground/40">or</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          {/* Google Sign In */}
          <button
            className="mt-6 w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-lg font-semibold text-foreground transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 flex items-center justify-center gap-3"
            onClick={signInWithGoogle}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {sent && (
            <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-900">Check your email</p>
                  <p className="mt-1 text-sm text-green-700">
                    Click the link we sent to log in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-5">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Social Proof */}
        <div className="mt-10 text-center">
          <p className="text-sm text-foreground/40">
            Join 10,000+ parents who use The Giddy List
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-foreground/30">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground/50">terms of service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-foreground/50">privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}
