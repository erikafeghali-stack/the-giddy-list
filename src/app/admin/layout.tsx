"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login?redirect=/admin");
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
          <p className="mt-3 text-sm text-foreground/50">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">Admin</span>
                <span className="rounded-full bg-red/10 px-2 py-0.5 text-xs font-medium text-red">
                  Dashboard
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin/guides"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Gift Guides
                </Link>
                <Link
                  href="/admin/products"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Products
                </Link>
              </nav>
            </div>
            <Link
              href="/"
              className="text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-2">
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/guides"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Guides
            </Link>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Products
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
