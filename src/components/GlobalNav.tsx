"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "./Avatar";
import { CreatorProfile } from "@/lib/types";

export default function GlobalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track scroll for nav shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
        });

        // Load profile
        const { data: profileData } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as CreatorProfile);
        }

        // Load unread notification count
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", data.session.user.id)
          .eq("is_read", false);

        setUnreadCount(count || 0);
      }
      setLoading(false);
    }

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (path: string) => pathname === path;

  // Don't show nav on login page
  if (pathname === "/login") return null;

  return (
    <nav className={`sticky top-0 z-50 bg-white/98 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}>
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl md:text-3xl font-black text-red tracking-tighter hover:opacity-80 transition-opacity duration-150"
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
          }}
        >
          The Giddy List
        </Link>

        {/* Desktop Navigation - Cleaner, more spaced */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive("/")
                    ? "text-red"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                href="/discover"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive("/discover")
                    ? "text-red"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Discover
              </Link>
              <Link
                href="/my-kids"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive("/my-kids")
                    ? "text-red"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                My Kids
              </Link>
              <Link
                href="/collections"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive("/collections")
                    ? "text-red"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Collections
              </Link>
              <Link
                href="/registry"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive("/registry")
                    ? "text-red"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Registries
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/discover"
                className="px-4 py-2 rounded-lg text-base font-medium text-foreground/60 hover:text-foreground transition-all duration-150"
              >
                Discover
              </Link>
              <a
                href="#how-it-works"
                className="px-4 py-2 rounded-lg text-base font-medium text-foreground/60 hover:text-foreground transition-all duration-150"
              >
                How It Works
              </a>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative p-2.5 rounded-full hover:bg-gray-100 transition-all duration-150"
              >
                <svg
                  className="w-5 h-5 text-foreground/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-all duration-150"
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || user.email}
                  size="sm"
                />
                <svg
                  className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-xl py-2 animate-fade-in">
                  {profile?.username && (
                    <Link
                      href={`/${profile.username}`}
                      className="block px-4 py-3 text-base text-foreground/80 hover:bg-gray-50 hover:text-foreground transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      View Profile
                    </Link>
                  )}
                  <Link
                    href="/settings/profile"
                    className="block px-4 py-3 text-base text-foreground/80 hover:bg-gray-50 hover:text-foreground transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-3 text-base text-foreground/80 hover:bg-gray-50 hover:text-foreground transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-2" />
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-4 py-3 text-base text-red hover:bg-red/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-base font-medium text-foreground/60 hover:text-foreground transition-all duration-150"
              >
                Log In
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-red px-6 py-2.5 text-base font-medium text-white hover:opacity-90 transition-all duration-150"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
