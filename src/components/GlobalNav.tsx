"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "./Avatar";
import { CreatorProfile } from "@/lib/types";

// Dropdown menu component
function NavDropdown({
  label,
  isOpen,
  onToggle,
  children,
  dropdownRef,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-4 py-2 rounded-lg text-base font-medium text-foreground/60 hover:text-foreground transition-all duration-150"
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-lg bg-white py-2 animate-dropdown-fade"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Dropdown item component
function DropdownItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-foreground/70 hover:bg-gray-50 hover:text-red transition-colors"
    >
      {children}
    </Link>
  );
}

// Dropdown section header
function DropdownHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
      {children}
    </div>
  );
}

// Dropdown divider
function DropdownDivider() {
  return <div className="border-t border-gray-100 my-1" />;
}

export default function GlobalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<(CreatorProfile & { guide_enabled?: boolean; guide_tier?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Dropdown states
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [forParentsOpen, setForParentsOpen] = useState(false);
  const [myKidsOpen, setMyKidsOpen] = useState(false);
  const [myListsOpen, setMyListsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Refs for click outside
  const discoverRef = useRef<HTMLDivElement>(null);
  const forParentsRef = useRef<HTMLDivElement>(null);
  const myKidsRef = useRef<HTMLDivElement>(null);
  const myListsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setDiscoverOpen(false);
    setForParentsOpen(false);
    setMyKidsOpen(false);
    setMyListsOpen(false);
    setProfileOpen(false);
  };

  // Handle logo click - navigate home and scroll to top
  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
          setProfile(profileData as CreatorProfile & { guide_enabled?: boolean });
        }
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

  // Handle click outside for all dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (discoverRef.current && !discoverRef.current.contains(target)) {
        setDiscoverOpen(false);
      }
      if (forParentsRef.current && !forParentsRef.current.contains(target)) {
        setForParentsOpen(false);
      }
      if (myKidsRef.current && !myKidsRef.current.contains(target)) {
        setMyKidsOpen(false);
      }
      if (myListsRef.current && !myListsRef.current.contains(target)) {
        setMyListsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Don't show nav on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* CSS for dropdown animation */}
      <style jsx global>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-dropdown-fade {
          animation: dropdownFade 0.15s ease-out forwards;
        }
      `}</style>

      <nav className={`sticky top-0 z-50 bg-white/98 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          {/* Logo - clickable, navigates home and scrolls to top */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="text-2xl md:text-3xl font-black text-red tracking-tighter hover:opacity-80 transition-opacity duration-150"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
            }}
          >
            The Giddy List
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* DISCOVER Dropdown (logged in) */}
                <NavDropdown
                  label="Discover"
                  isOpen={discoverOpen}
                  onToggle={() => {
                    setDiscoverOpen(!discoverOpen);
                    setMyKidsOpen(false);
                    setMyListsOpen(false);
                  }}
                  dropdownRef={discoverRef}
                >
                  <DropdownHeader>By Age</DropdownHeader>
                  <DropdownItem href="/discover/age/babies" onClick={closeAllDropdowns}>Babies (0-2)</DropdownItem>
                  <DropdownItem href="/discover/age/toddlers" onClick={closeAllDropdowns}>Toddlers (3-5)</DropdownItem>
                  <DropdownItem href="/discover/age/kids" onClick={closeAllDropdowns}>Kids (6-8)</DropdownItem>
                  <DropdownItem href="/discover/age/tweens" onClick={closeAllDropdowns}>Tweens (9-12)</DropdownItem>
                  <DropdownItem href="/discover/age/teens" onClick={closeAllDropdowns}>Teens (13-18)</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/discover/guides" onClick={closeAllDropdowns}>Gift Guides</DropdownItem>
                  <DropdownItem href="/discover/trending" onClick={closeAllDropdowns}>Trending Lists</DropdownItem>
                </NavDropdown>

                {/* MY KIDS Dropdown */}
                <NavDropdown
                  label="My Kids"
                  isOpen={myKidsOpen}
                  onToggle={() => {
                    setMyKidsOpen(!myKidsOpen);
                    setDiscoverOpen(false);
                    setMyListsOpen(false);
                  }}
                  dropdownRef={myKidsRef}
                >
                  <DropdownItem href="/my-kids" onClick={closeAllDropdowns}>View All Kids</DropdownItem>
                  <DropdownItem href="/my-kids?add=true" onClick={closeAllDropdowns}>Add a Kid</DropdownItem>
                </NavDropdown>

                {/* MY LISTS Dropdown */}
                <NavDropdown
                  label="My Lists"
                  isOpen={myListsOpen}
                  onToggle={() => {
                    setMyListsOpen(!myListsOpen);
                    setDiscoverOpen(false);
                    setMyKidsOpen(false);
                  }}
                  dropdownRef={myListsRef}
                >
                  <DropdownItem href="/my-kids" onClick={closeAllDropdowns}>Wishlists</DropdownItem>
                  <DropdownItem href="/registry" onClick={closeAllDropdowns}>Registries</DropdownItem>
                  <DropdownItem href="/collections" onClick={closeAllDropdowns}>Collections</DropdownItem>
                </NavDropdown>
              </>
            ) : (
              <>
                {/* DISCOVER Dropdown (logged out) */}
                <NavDropdown
                  label="Discover"
                  isOpen={discoverOpen}
                  onToggle={() => {
                    setDiscoverOpen(!discoverOpen);
                    setForParentsOpen(false);
                  }}
                  dropdownRef={discoverRef}
                >
                  <DropdownHeader>By Age</DropdownHeader>
                  <DropdownItem href="/discover/age/babies" onClick={closeAllDropdowns}>Babies (0-2)</DropdownItem>
                  <DropdownItem href="/discover/age/toddlers" onClick={closeAllDropdowns}>Toddlers (3-5)</DropdownItem>
                  <DropdownItem href="/discover/age/kids" onClick={closeAllDropdowns}>Kids (6-8)</DropdownItem>
                  <DropdownItem href="/discover/age/tweens" onClick={closeAllDropdowns}>Tweens (9-12)</DropdownItem>
                  <DropdownItem href="/discover/age/teens" onClick={closeAllDropdowns}>Teens (13-18)</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/discover/guides" onClick={closeAllDropdowns}>Gift Guides</DropdownItem>
                  <DropdownItem href="/discover/trending" onClick={closeAllDropdowns}>Trending Lists</DropdownItem>
                </NavDropdown>

                {/* FOR PARENTS Dropdown */}
                <NavDropdown
                  label="For Parents"
                  isOpen={forParentsOpen}
                  onToggle={() => {
                    setForParentsOpen(!forParentsOpen);
                    setDiscoverOpen(false);
                  }}
                  dropdownRef={forParentsRef}
                >
                  <DropdownItem href="/#how-it-works" onClick={closeAllDropdowns}>How It Works</DropdownItem>
                  <DropdownItem href="/login" onClick={closeAllDropdowns}>Create a Wishlist</DropdownItem>
                  <DropdownItem href="/login" onClick={closeAllDropdowns}>Create a Registry</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/dashboard/become-guide" onClick={closeAllDropdowns}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Become a Giddy Guide
                    </span>
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/extension" onClick={closeAllDropdowns}>Download Extension</DropdownItem>
                </NavDropdown>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <>
                {/* Show "Earn Money" CTA for non-guides */}
                {!profile?.guide_enabled && (
                  <Link
                    href="/dashboard/become-guide"
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-gradient-to-r from-gold-light to-red-light text-xs md:text-sm font-medium text-foreground hover:shadow-md transition-all duration-150"
                  >
                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Earn Money
                  </Link>
                )}
                {/* Profile/Avatar Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setDiscoverOpen(false);
                      setMyKidsOpen(false);
                      setMyListsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-all duration-150"
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.display_name || user.email}
                      size="sm"
                    />
                    <svg
                      className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${
                        profileOpen ? "rotate-180" : ""
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

                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-lg bg-white py-2 animate-dropdown-fade"
                      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    >
                      <Link
                        href="/settings"
                        className="block px-4 py-2.5 text-sm text-foreground/70 hover:bg-gray-50 hover:text-red transition-colors"
                        onClick={closeAllDropdowns}
                      >
                        Account Settings
                      </Link>
                      <Link
                        href={profile?.guide_enabled ? "/dashboard/earnings" : "/dashboard/become-guide"}
                        className="block px-4 py-2.5 text-sm text-foreground/70 hover:bg-gray-50 hover:text-red transition-colors"
                        onClick={closeAllDropdowns}
                      >
                        {profile?.guide_enabled ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Earnings
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Become a Guide
                          </span>
                        )}
                      </Link>
                      <DropdownDivider />
                      <button
                        onClick={() => {
                          closeAllDropdowns();
                          handleSignOut();
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red hover:bg-red/5 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/become-guide"
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-gradient-to-r from-gold-light to-red-light text-xs md:text-sm font-medium text-foreground hover:shadow-md transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Earn Money
                </Link>
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
    </>
  );
}
