import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct, normalizeUrl } from '@/lib/scraper';
import { addAffiliateLink } from '@/lib/affiliate';
import { ScrapeResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ScrapeResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Normalize and scrape the URL
    const normalizedUrl = normalizeUrl(url);
    const scrapedData = await scrapeProduct(normalizedUrl);

    // Add affiliate link
    const productWithAffiliate = addAffiliateLink(scrapedData);

    return NextResponse.json({
      success: true,
      data: productWithAffiliate,
    });
  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scrape product' },
      { status: 500 }
    );
  }
}
