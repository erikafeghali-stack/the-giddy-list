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
          <Link href="#" className="underline hover:text-foreground/50">terms of service</Link>
          {" "}and{" "}
          <Link href="#" className="underline hover:text-foreground/50">privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}
