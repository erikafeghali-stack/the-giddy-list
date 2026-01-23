"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { GiftClaim, WishlistItem } from "@/lib/types";

interface ThankYouNoteModalProps {
  claim: GiftClaim;
  item: WishlistItem | undefined;
  onClose: () => void;
  onSent?: () => void;
}

export default function ThankYouNoteModal({
  claim,
  item,
  onClose,
  onSent,
}: ThankYouNoteModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    // Insert thank you note
    const { error } = await supabase.from("thank_you_notes").insert({
      claim_id: claim.id,
      sender_id: userId || null,
      recipient_email: claim.guest_email || null,
      message: message.trim(),
    });

    if (error) {
      alert("Failed to send thank you note");
      setSending(false);
      return;
    }

    // Create notification for the gift giver if they have an account
    if (claim.user_id) {
      await supabase.from("notifications").insert({
        user_id: claim.user_id,
        type: "thank_you",
        title: "You received a thank you note!",
        message: message.trim().substring(0, 100) + (message.length > 100 ? "..." : ""),
        data: {
          claim_id: claim.id,
          item_title: item?.title || "a gift",
        },
      });
    }

    setSent(true);
    setSending(false);
    onSent?.();
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Thank You Sent!</h2>
          <p className="mt-2 text-sm text-foreground/60">
            {claim.guest_email
              ? `Your message has been sent to ${claim.guest_name || "your gift giver"}.`
              : "Your thank you note has been saved."}
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Send Thank You Note</h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Recipient Info */}
        <div className="p-4 bg-cream-dark/30 border-b border-border">
          <div className="flex items-center gap-3">
            {item?.image_url && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                <Image
                  src={item.image_url}
                  alt={item.title || "Product"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-foreground">
                To: {claim.guest_name || "Anonymous"}
              </div>
              <div className="text-xs text-foreground/60">
                For {claim.claim_type === "purchased" ? "purchasing" : "reserving"}{" "}
                {item?.title || "a gift"}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you so much for the thoughtful gift..."
              rows={4}
              className="w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40 resize-none"
              required
            />
          </div>

          {!claim.guest_email && (
            <p className="mt-3 text-xs text-foreground/50 bg-cream-dark/50 rounded-lg p-2">
              Note: This gift giver didn't provide an email, so the thank you note will be saved but not sent directly.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-cream-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex-1 rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
