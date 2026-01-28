"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MobileNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
      setLoading(false);
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session?.user);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Don't show on login page or when not logged in
  if (pathname === "/login" || loading || !isLoggedIn) return null;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
            pathname === "/"
              ? "text-red"
              : "text-foreground/40"
          }`}
        >
          <svg className="w-6 h-6" fill={pathname === "/" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === "/" ? 0 : 1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Discover */}
        <Link
          href="/discover"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
            isActive("/discover")
              ? "text-red"
              : "text-foreground/40"
          }`}
        >
          <svg className="w-6 h-6" fill={isActive("/discover") ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive("/discover") ? 0 : 1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        {/* Create (Center Button) */}
        <Link
          href="/collections/new"
          className="flex items-center justify-center w-12 h-12 -mt-3 rounded-full bg-red text-white shadow-lg shadow-red/30 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* My Lists */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
            isActive("/dashboard") || isActive("/collections") || isActive("/registry")
              ? "text-red"
              : "text-foreground/40"
          }`}
        >
          <svg className="w-6 h-6" fill={isActive("/dashboard") || isActive("/collections") || isActive("/registry") ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive("/dashboard") || isActive("/collections") || isActive("/registry") ? 0 : 1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-medium">My Lists</span>
        </Link>

        {/* Profile */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
            isActive("/settings")
              ? "text-red"
              : "text-foreground/40"
          }`}
        >
          <svg className="w-6 h-6" fill={isActive("/settings") ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive("/settings") ? 0 : 1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
