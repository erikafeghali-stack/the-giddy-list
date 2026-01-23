"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  className?: string;
}

// Domains that need proxying (retailer images that block hotlinking)
const PROXY_DOMAINS = [
  'amazon.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-amazon.com',
  'target.com',
  'target.scene7.com',
  'walmart.com',
  'i5.walmartimages.com',
];

function needsProxy(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PROXY_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

function getProxiedUrl(url: string): string {
  if (needsProxy(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function ProductImage({
  src,
  alt,
  fill = true,
  className = "",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or error, show fallback with clean icon
  if (!src || hasError) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center ${fill ? 'absolute inset-0' : 'w-full h-full'}`}>
        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    );
  }

  const imageSrc = getProxiedUrl(src);

  return (
    <>
      {isLoading && (
        <div className={`bg-cream-dark animate-pulse ${fill ? 'absolute inset-0' : 'w-full h-full'}`} />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        unoptimized
      />
    </>
  );
}
