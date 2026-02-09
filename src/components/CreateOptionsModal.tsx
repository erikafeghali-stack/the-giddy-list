"use client";

import Link from "next/link";
import EarnBadge from "./EarnBadge";

interface CreateOptionsModalProps {
  onClose: () => void;
}

export default function CreateOptionsModal({ onClose }: CreateOptionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            What would you like to create?
          </h2>
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Family Section */}
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-red"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                For My Family
              </span>
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              Create wishlists and registries to share with family
            </p>
            <div className="flex gap-2">
              <Link
                href="/dashboard?add=true"
                onClick={onClose}
                className="flex-1 rounded-xl bg-red px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-red-hover transition-colors"
              >
                Create Wishlist
              </Link>
              <Link
                href="/registry/new"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground text-center hover:bg-cream-dark transition-colors"
              >
                Create Registry
              </Link>
            </div>
          </div>

          {/* Earn Section */}
          <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold-light/30 to-red-light/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Create &amp; Earn
              </span>
              <EarnBadge size="sm" />
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              Make gift guides and earn money from recommendations
            </p>
            <Link
              href="/collections/new"
              onClick={onClose}
              className="block w-full rounded-xl bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-medium text-white text-center hover:opacity-90 transition-opacity"
            >
              Create Gift Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
