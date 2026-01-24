"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCookieSetter() {
  useEffect(() => {
    // Set cookie when session changes
    const setCookie = (session: { access_token: string; refresh_token: string } | null) => {
      if (session) {
        // Set access token cookie for extension
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`;
      } else {
        // Clear cookies on logout
        document.cookie = "sb-access-token=; path=/; max-age=0";
        document.cookie = "sb-refresh-token=; path=/; max-age=0";
      }
    };

    // Check current session and set cookie
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCookie(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCookie(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
