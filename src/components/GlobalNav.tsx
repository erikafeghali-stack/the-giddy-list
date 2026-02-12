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
  icon,
  transparent,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  icon?: React.ReactNode;
  transparent?: boolean;
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-base font-medium transition-all duration-150 ${
          transparent
            ? "text-white/80 hover:text-white"
            : "text-foreground/60 hover:text-foreground"
        }`}
      >
        {label}
        {icon}
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
  const isTransparent = pathname === "/" && !scrolled;

  // Dropdown states
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [forParentsOpen, setForParentsOpen] = useState(false);
  const [myFamilyOpen, setMyFamilyOpen] = useState(false);
  const [createEarnOpen, setCreateEarnOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Refs for click outside
  const discoverRef = useRef<HTMLDivElement>(null);
  const forParentsRef = useRef<HTMLDivElement>(null);
  const myFamilyRef = useRef<HTMLDivElement>(null);
  const createEarnRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setDiscoverOpen(false);
    setForParentsOpen(false);
    setMyFamilyOpen(false);
    setCreateEarnOpen(false);
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
      if (myFamilyRef.current && !myFamilyRef.current.contains(target)) {
        setMyFamilyOpen(false);
      }
      if (createEarnRef.current && !createEarnRef.current.contains(target)) {
        setCreateEarnOpen(false);
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

  // $ icon for Create & Earn
  const dollarIcon = (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-gold-light to-gold text-[10px] font-bold text-foreground">
      $
    </span>
  );

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

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/98 backdrop-blur-md shadow-sm"
          : pathname === "/"
            ? "bg-transparent"
            : "bg-white/98 backdrop-blur-md"
      }`}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          {/* Logo - Wordmark Image */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity duration-150"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="The Giddy List"
              className={`h-14 md:h-16 w-auto transition-all duration-300 ${
                isTransparent ? "brightness-0 invert" : ""
              }`}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* MY FAMILY Dropdown */}
                <NavDropdown
                  label="My Family"
                  isOpen={myFamilyOpen}
                  onToggle={() => {
                    setMyFamilyOpen(!myFamilyOpen);
                    setDiscoverOpen(false);
                    setCreateEarnOpen(false);
                  }}
                  dropdownRef={myFamilyRef}
                  transparent={isTransparent}
                >
                  <DropdownItem href="/dashboard" onClick={closeAllDropdowns}>My Kids</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/my-kids" onClick={closeAllDropdowns}>Wishlists</DropdownItem>
                  <DropdownItem href="/registry" onClick={closeAllDropdowns}>Registries</DropdownItem>
                </NavDropdown>

                {/* CREATE & EARN Dropdown (with $ icon) */}
                <NavDropdown
                  label="Create & Earn"
                  isOpen={createEarnOpen}
                  onToggle={() => {
                    setCreateEarnOpen(!createEarnOpen);
                    setDiscoverOpen(false);
                    setMyFamilyOpen(false);
                  }}
                  dropdownRef={createEarnRef}
                  icon={dollarIcon}
                  transparent={isTransparent}
                >
                  <DropdownItem href="/collections" onClick={closeAllDropdowns}>My Guides</DropdownItem>
                  <DropdownItem href={profile?.guide_enabled ? "/dashboard/earnings" : "/dashboard/become-guide"} onClick={closeAllDropdowns}>
                    {profile?.guide_enabled ? "Earnings" : "Start Earning"}
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/collections/new" onClick={closeAllDropdowns}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Guide
                    </span>
                  </DropdownItem>
                </NavDropdown>

                {/* DISCOVER Dropdown (logged in) */}
                <NavDropdown
                  label="Discover"
                  isOpen={discoverOpen}
                  onToggle={() => {
                    setDiscoverOpen(!discoverOpen);
                    setMyFamilyOpen(false);
                    setCreateEarnOpen(false);
                  }}
                  dropdownRef={discoverRef}
                  transparent={isTransparent}
                >
                  <DropdownItem href="/discover/age/0-2" onClick={closeAllDropdowns}>Babies (0-2)</DropdownItem>
                  <DropdownItem href="/discover/age/3-5" onClick={closeAllDropdowns}>Toddlers (3-5)</DropdownItem>
                  <DropdownItem href="/discover/age/6-8" onClick={closeAllDropdowns}>Kids (6-8)</DropdownItem>
                  <DropdownItem href="/discover/age/9-12" onClick={closeAllDropdowns}>Tweens (9-12)</DropdownItem>
                  <DropdownItem href="/discover/age/13-18" onClick={closeAllDropdowns}>Teens (13-18)</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/guides" onClick={closeAllDropdowns}>Browse Guides</DropdownItem>
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
                  transparent={isTransparent}
                >
                  <DropdownItem href="/discover/age/0-2" onClick={closeAllDropdowns}>Babies (0-2)</DropdownItem>
                  <DropdownItem href="/discover/age/3-5" onClick={closeAllDropdowns}>Toddlers (3-5)</DropdownItem>
                  <DropdownItem href="/discover/age/6-8" onClick={closeAllDropdowns}>Kids (6-8)</DropdownItem>
                  <DropdownItem href="/discover/age/9-12" onClick={closeAllDropdowns}>Tweens (9-12)</DropdownItem>
                  <DropdownItem href="/discover/age/13-18" onClick={closeAllDropdowns}>Teens (13-18)</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/guides" onClick={closeAllDropdowns}>Browse Guides</DropdownItem>
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
                  transparent={isTransparent}
                >
                  <DropdownItem href="/#how-it-works" onClick={closeAllDropdowns}>How It Works</DropdownItem>
                  <DropdownItem href="/login" onClick={closeAllDropdowns}>Create a Wishlist</DropdownItem>
                  <DropdownItem href="/login" onClick={closeAllDropdowns}>Create a Registry</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="/dashboard/become-guide" onClick={closeAllDropdowns}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Create & Earn
                    </span>
                  </DropdownItem>
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
                {/* Profile/Avatar Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setDiscoverOpen(false);
                      setMyFamilyOpen(false);
                      setCreateEarnOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-full p-1 transition-all duration-150 ${
                      isTransparent ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.display_name || user.email}
                      size="sm"
                    />
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        profileOpen ? "rotate-180" : ""
                      } ${isTransparent ? "text-white/60" : "text-foreground/40"}`}
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
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-light to-gold text-sm font-medium text-foreground hover:shadow-md transition-all duration-150"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Create & Earn
                </Link>
                <Link
                  href="/login"
                  className={`px-4 py-2 text-base font-medium transition-all duration-150 ${
                    isTransparent
                      ? "text-white/80 hover:text-white"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-red px-6 py-2.5 text-base font-medium text-white hover:opacity-90 transition-all duration-150"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
