import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Amazon product images
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'images-amazon.com' },
      // Walmart product images
      { protocol: 'https', hostname: 'i5.walmartimages.com' },
      // Target product images
      { protocol: 'https', hostname: 'target.scene7.com' },
      // Generic fallbacks for Open Graph images
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
  async redirects() {
    return [
      // /my-kids -> /dashboard
      {
        source: '/my-kids',
        destination: '/dashboard',
        permanent: true,
      },
      // /r/:slug (short registry URL) -> /s/:slug (short shortlist URL)
      {
        source: '/r/:slug',
        destination: '/s/:slug',
        permanent: true,
      },
      // /discover/guides -> /guides
      {
        source: '/discover/guides',
        destination: '/guides',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
