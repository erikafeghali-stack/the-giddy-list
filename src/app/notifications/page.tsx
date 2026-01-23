"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Notification, NotificationType } from "@/lib/types";
import Avatar from "@/components/Avatar";

// Clean SVG icons for notification types
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconClass = "w-5 h-5";
  switch (type) {
    case "follow":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "claim":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case "thank_you":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "collection_like":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications((data || []) as Notification[]);
      setLoading(false);

      // Mark all as read
      if (data && data.length > 0) {
        const unreadIds = data.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    }

    loadNotifications();
  }, [router]);

  async function clearAll() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", sessionData.session.user.id);

    setNotifications([]);
  }

  function getNotificationLink(notification: Notification): string | null {
    const data = notification.data as Record<string, string> | null;
    if (!data) return null;

    switch (notification.type) {
      case "follow":
        return data.follower_username ? `/${data.follower_username}` : null;
      case "claim":
        return data.registry_slug ? `/registry/${data.registry_slug}` : null;
      case "thank_you":
        return data.registry_slug ? `/registry/${data.registry_slug}` : null;
      case "collection_like":
        return data.collection_slug ? `/collections/${data.collection_slug}` : null;
      default:
        return null;
    }
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-2xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Stay updated on activity
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-foreground/60 hover:text-red transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-foreground/50">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-8 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-foreground">
              No notifications yet
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              When someone follows you or claims a gift, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    notification.is_read
                      ? "border-border bg-card"
                      : "border-red/20 bg-red-light"
                  } ${link ? "hover:bg-cream-dark cursor-pointer" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-foreground/60">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {notification.title}
                    </div>
                    {notification.message && (
                      <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-foreground/50">
                      {formatTime(notification.created_at)}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-red flex-shrink-0 mt-2" />
                  )}
                </div>
              );

              return link ? (
                <Link key={notification.id} href={link}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
