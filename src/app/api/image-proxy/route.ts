import { NextRequest, NextResponse } from 'next/server';

// Cache for 24 hours
const CACHE_MAX_AGE = 60 * 60 * 24;

// Allowed image domains (security measure)
const ALLOWED_DOMAINS = [
  'amazon.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-amazon.com',
  'ws-na.amazon-adsystem.com',
  'target.com',
  'target.scene7.com',
  'walmart.com',
  'i5.walmartimages.com',
  'unsplash.com',
  'images.unsplash.com',
];

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Validate URL
  try {
    new URL(imageUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  // Security check - only allow specific domains
  if (!isAllowedDomain(imageUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed' },
      { status: 403 }
    );
  }

  try {
    // Fetch the image with browser-like headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with caching headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
