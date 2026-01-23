// Content script for scraping product data from any page

// Product data scraping functions
function scrapeProductData() {
  const data = {
    title: scrapeTitle(),
    image: scrapeImage(),
    price: scrapePrice(),
    url: window.location.href,
    domain: window.location.hostname
  };

  return data;
}

// Scrape product title
function scrapeTitle() {
  // Try multiple selectors in order of specificity
  const selectors = [
    // Amazon
    '#productTitle',
    '#title',
    // Target
    '[data-test="product-title"]',
    // Walmart
    '[itemprop="name"]',
    // Generic e-commerce
    'h1[class*="product"]',
    'h1[class*="title"]',
    '[class*="product-title"]',
    '[class*="product-name"]',
    '[class*="ProductTitle"]',
    // Open Graph
    'meta[property="og:title"]',
    // Schema.org
    '[itemprop="name"]',
    // Fallback to first h1
    'h1'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        return element.getAttribute('content')?.trim();
      }
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 500) {
        return text;
      }
    }
  }

  // Fallback to page title
  return document.title?.split('|')[0]?.split('-')[0]?.trim() || '';
}

// Scrape product image
function scrapeImage() {
  const selectors = [
    // Open Graph (most reliable)
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    // Twitter cards
    'meta[name="twitter:image"]',
    // Amazon
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '.a-dynamic-image',
    // Target
    '[data-test="product-image"] img',
    // Walmart
    '.prod-hero-image img',
    // Generic e-commerce
    '[class*="product-image"] img',
    '[class*="ProductImage"] img',
    '[class*="gallery"] img',
    '[class*="main-image"] img',
    '[itemprop="image"]',
    // Schema.org
    'img[itemprop="image"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        const content = element.getAttribute('content');
        if (content && isValidImageUrl(content)) {
          return content;
        }
      } else if (element.tagName === 'IMG') {
        // Try src first, then data-src for lazy loaded images
        const src = element.getAttribute('src') ||
                    element.getAttribute('data-src') ||
                    element.getAttribute('data-old-hires') ||
                    element.getAttribute('data-a-dynamic-image');

        // Handle Amazon's dynamic image JSON
        if (src && src.startsWith('{')) {
          try {
            const parsed = JSON.parse(src);
            const urls = Object.keys(parsed);
            if (urls.length > 0) {
              return urls[0];
            }
          } catch (e) {}
        }

        if (src && isValidImageUrl(src)) {
          return src;
        }
      }
    }
  }

  // Fallback: find the largest image on the page
  const images = Array.from(document.querySelectorAll('img'));
  let bestImage = null;
  let bestSize = 0;

  for (const img of images) {
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    const size = width * height;

    if (size > bestSize && size > 10000 && isValidImageUrl(img.src)) {
      bestSize = size;
      bestImage = img.src;
    }
  }

  return bestImage || '';
}

// Scrape product price
function scrapePrice() {
  const selectors = [
    // Amazon
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    '.a-price-whole',
    '#corePrice_feature_div .a-offscreen',
    // Target
    '[data-test="product-price"]',
    // Walmart
    '[itemprop="price"]',
    '.price-characteristic',
    // Generic e-commerce
    '[class*="product-price"]',
    '[class*="ProductPrice"]',
    '[class*="sale-price"]',
    '[class*="current-price"]',
    '.price',
    '[data-price]',
    // Schema.org
    '[itemprop="price"]',
    'meta[property="product:price:amount"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let price;

      if (element.tagName === 'META') {
        price = element.getAttribute('content');
      } else if (element.hasAttribute('data-price')) {
        price = element.getAttribute('data-price');
      } else if (element.hasAttribute('content')) {
        price = element.getAttribute('content');
      } else {
        price = element.textContent;
      }

      if (price) {
        // Extract numeric price
        const cleaned = cleanPrice(price);
        if (cleaned) {
          return cleaned;
        }
      }
    }
  }

  // Try to find any price-like text on the page
  const priceRegex = /\$[\d,]+\.?\d*/g;
  const bodyText = document.body.innerText;
  const matches = bodyText.match(priceRegex);

  if (matches && matches.length > 0) {
    return cleanPrice(matches[0]);
  }

  return '';
}

// Helper: Clean price string
function cleanPrice(price) {
  if (!price) return '';

  // Remove whitespace and normalize
  price = price.trim();

  // Extract just the number with decimal
  const match = price.match(/[\d,]+\.?\d*/);
  if (match) {
    // Remove commas and format
    const num = parseFloat(match[0].replace(/,/g, ''));
    if (!isNaN(num) && num > 0 && num < 100000) {
      return num.toFixed(2);
    }
  }

  return '';
}

// Helper: Check if URL is a valid image
function isValidImageUrl(url) {
  if (!url) return false;

  // Skip tiny images, icons, and tracking pixels
  const invalidPatterns = [
    'pixel', 'spacer', '1x1', 'blank', 'transparent',
    'icon', 'logo', 'sprite', 'button', 'badge',
    'tracking', 'beacon', 'analytics'
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of invalidPatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }

  // Must be http/https or data URL
  return url.startsWith('http') || url.startsWith('data:image');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeProduct') {
    const data = scrapeProductData();
    sendResponse(data);
  }
  return true; // Keep channel open for async response
});
