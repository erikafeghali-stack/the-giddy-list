"use client";

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  usePlaceholder?: boolean; // Use UI Avatars API for placeholder
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Generate UI Avatars URL
function getUIAvatarUrl(name: string | null | undefined, size: number): string {
  const displayName = name || "User";
  const encoded = encodeURIComponent(displayName);
  // Using warm, friendly colors that match the brand
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size * 2}&background=FEE8EB&color=E31837&bold=true&format=svg`;
}

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
  usePlaceholder = true,
}: AvatarProps) {
  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];
  const pxSize = sizePx[size];

  // If we have a real image, use it
  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-full bg-cream flex-shrink-0 ${sizeClass} ${className}`}
      >
        <Image
          src={src}
          alt={name || "Avatar"}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  // Use UI Avatars API for a nicer placeholder
  if (usePlaceholder) {
    const placeholderUrl = getUIAvatarUrl(name, pxSize);
    return (
      <div
        className={`relative overflow-hidden rounded-full bg-red-light flex-shrink-0 ${sizeClass} ${className}`}
      >
        <Image
          src={placeholderUrl}
          alt={name || "Avatar"}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  // Fallback to simple initials
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-red-light text-red font-medium flex-shrink-0 ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}
