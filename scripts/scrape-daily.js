#!/usr/bin/env node
/**
 * Daily Scraper Script for Stilix
 *
 * Run this script daily via cron to fetch fresh product data from Macedonian fashion shops.
 *
 * Usage:
 *   node scripts/scrape-daily.js
 *
 * Cron example (run daily at 6 AM):
 *   0 6 * * * cd /path/to/Stilix && node scripts/scrape-daily.js >> logs/scraper.log 2>&1
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'scrapedProducts.json');
const SCRAPE_TIMEOUT = 30000; // 30 seconds per shop
const MAX_PRODUCTS_PER_SHOP = 50;

// Shop configurations with correct Macedonian URLs
const SHOPS = [
  {
    id: 'lc_waikiki',
    name: 'LC Waikiki MK',
    urls: [
      'https://www.lcwaikiki.com/mk-MK/MK/sale',
      'https://www.lcwaikiki.com/mk-MK/MK/sale/mens',
      'https://www.lcwaikiki.com/mk-MK/MK/sale/womens',
    ],
    category: 'fashion',
  },
  {
    id: 'reserved_mk',
    name: 'Reserved MK',
    urls: [
      'https://www.reserved.com/mk/mk/zhena/sezonska-ponuda',
      'https://www.reserved.com/mk/mk/mazh/sezonska-ponuda',
    ],
    category: 'fashion',
  },
  {
    id: 'house_mk',
    name: 'House MK',
    urls: [
      'https://www.housebrand.com/mk/mk/special-offer-ro/all',
      'https://www.housebrand.com/mk/mk/special-offer-ro/for-her',
      'https://www.housebrand.com/mk/mk/special-offer-ro/for-him',
    ],
    category: 'fashion',
  },
  {
    id: 'cropp_mk',
    name: 'Cropp MK',
    urls: [
      'https://www.cropp.com/mk/mk/sale',
      'https://www.cropp.com/mk/mk/sale/women',
      'https://www.cropp.com/mk/mk/sale/men',
    ],
    category: 'fashion',
  },
  {
    id: 'sinsay_mk',
    name: 'Sinsay MK',
    urls: [
      'https://www.sinsay.com/mk/mk/sale',
      'https://www.sinsay.com/mk/mk/sale/women',
      'https://www.sinsay.com/mk/mk/sale/men',
    ],
    category: 'fashion',
  },
  {
    id: 'office_shoes',
    name: 'Office Shoes MK',
    urls: [
      'https://www.officeshoes.mk/mk/akcija',
      'https://www.officeshoes.mk/mk/akcija/zenski',
      'https://www.officeshoes.mk/mk/akcija/mashi',
    ],
    category: 'shoes',
  },
  {
    id: 'buzz_sneakers',
    name: 'Buzz Sneakers MK',
    urls: [
      'https://www.buzzsneakers.com/mk/akcija',
      'https://www.buzzsneakers.com/mk/akcija/women',
      'https://www.buzzsneakers.com/mk/akcija/men',
    ],
    category: 'shoes',
  },
  {
    id: 'zara_mk',
    name: 'Zara MK',
    urls: [
      'https://www.zara.com/mk/en/woman-special-prices-l1314.html',
      'https://www.zara.com/mk/en/man-special-prices-l806.html',
    ],
    category: 'fashion',
  },
  {
    id: 'hm_mk',
    name: 'H&M MK',
    urls: [
      'https://www2.hm.com/mk_mk/rasprodazba/zheni.html',
      'https://www2.hm.com/mk_mk/rasprodazba/mazhi.html',
    ],
    category: 'fashion',
  },
  {
    id: 'bershka_mk',
    name: 'Bershka MK',
    urls: [
      'https://www.bershka.com/mk/woman/sale-c1010378020.html',
      'https://www.bershka.com/mk/man/sale-c1010378518.html',
    ],
    category: 'fashion',
  },
  {
    id: 'pullbear_mk',
    name: 'Pull&Bear MK',
    urls: [
      'https://www.pullandbear.com/mk/woman/sale-n6417',
      'https://www.pullandbear.com/mk/man/sale-n6485',
    ],
    category: 'fashion',
  },
  {
    id: 'stradivarius_mk',
    name: 'Stradivarius MK',
    urls: [
      'https://www.stradivarius.com/mk/woman/sale-c1020206580.html',
    ],
    category: 'fashion',
  },
  {
    id: 'mango_mk',
    name: 'Mango MK',
    urls: [
      'https://shop.mango.com/mk/en/women/sale_cg1720',
      'https://shop.mango.com/mk/en/men/sale_cg1721',
    ],
    category: 'fashion',
  },
  {
    id: 'sportsvision_mk',
    name: 'Sport Vision MK',
    urls: [
      'https://www.sportvision.mk/akcija',
      'https://www.sportvision.mk/akcija/obuvki',
      'https://www.sportvision.mk/akcija/obleka',
    ],
    category: 'sportswear',
  },
  {
    id: 'anmag_mk',
    name: 'AnMag MK',
    urls: [
      'https://www.anmag.mk/popust',
    ],
    category: 'fashion',
  },
  {
    id: 'pakan_mk',
    name: 'Pakan Sport MK',
    urls: [
      'https://www.pakansport.mk/rasprodazba',
    ],
    category: 'sportswear',
  },
];

// Fetch URL with timeout
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,mk;q=0.8',
      },
      timeout: SCRAPE_TIMEOUT,
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        console.log(`  Redirecting to: ${redirectUrl}`);
        fetchUrl(redirectUrl).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Extract price from text (handles Macedonian format: 1.299,00 ден)
function extractPrice(text) {
  if (!text) return 0;

  // Remove currency symbols and text
  let cleaned = text.replace(/ден|MKD|EUR|€|денари|RSD|din/gi, '').trim();

  // Remove any HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Handle Macedonian format: 1.299,00 or 1.299
  // Period is thousands separator, comma is decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Format: 1.299,00 -> remove dots, replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Could be 1.299 (thousands) or 12.99 (decimal)
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      // 1.299 format - dot is thousands separator
      cleaned = cleaned.replace('.', '');
    }
    // else: 12.99 format - dot is decimal, keep as is
  } else if (cleaned.includes(',')) {
    // 1299,00 - comma is decimal
    cleaned = cleaned.replace(',', '.');
  }

  // Remove any remaining non-numeric except decimal point
  cleaned = cleaned.replace(/[^0-9.]/g, '');

  const price = parseFloat(cleaned) || 0;
  return price;
}

// Extract prices specifically from price-related elements
function extractPricesFromHtml(productHtml) {
  const prices = {
    original: 0,
    sale: 0
  };

  // Look for data attributes first (most reliable)
  const dataOriginalMatch = productHtml.match(/data-(?:original-price|old-price|regular-price|price-old)="([^"]+)"/i);
  const dataSaleMatch = productHtml.match(/data-(?:sale-price|current-price|price-new|price|final-price)="([^"]+)"/i);

  if (dataOriginalMatch) {
    prices.original = extractPrice(dataOriginalMatch[1]);
  }
  if (dataSaleMatch) {
    prices.sale = extractPrice(dataSaleMatch[1]);
  }

  // If we found both from data attributes, return
  if (prices.original > 0 && prices.sale > 0 && prices.original > prices.sale) {
    return prices;
  }

  // Look for specific price classes
  const pricePatterns = [
    // Original/old price patterns
    {
      type: 'original',
      patterns: [
        /class="[^"]*(?:old-price|original-price|regular-price|was-price|price-old|line-through|strikethrough)[^"]*"[^>]*>([^<]*[\d.,]+[^<]*)</gi,
        /<s[^>]*>([^<]*[\d.,]+[^<]*)<\/s>/gi,
        /<del[^>]*>([^<]*[\d.,]+[^<]*)<\/del>/gi,
        /<strike[^>]*>([^<]*[\d.,]+[^<]*)<\/strike>/gi,
      ]
    },
    // Sale/current price patterns
    {
      type: 'sale',
      patterns: [
        /class="[^"]*(?:sale-price|current-price|special-price|price-new|final-price|now-price|price-sale)[^"]*"[^>]*>([^<]*[\d.,]+[^<]*)</gi,
        /class="[^"]*price[^"]*"[^>]*>[^<]*<span[^>]*>([^<]*[\d.,]+[^<]*)</gi,
      ]
    }
  ];

  for (const priceType of pricePatterns) {
    for (const pattern of priceType.patterns) {
      const matches = [...productHtml.matchAll(pattern)];
      for (const match of matches) {
        const price = extractPrice(match[1]);
        if (price >= 50 && price <= 100000) {
          if (priceType.type === 'original' && prices.original === 0) {
            prices.original = price;
          } else if (priceType.type === 'sale' && prices.sale === 0) {
            prices.sale = price;
          }
        }
      }
    }
  }

  // If still no prices, look for generic price container
  if (prices.original === 0 || prices.sale === 0) {
    const priceContainerMatch = productHtml.match(/class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi);
    if (priceContainerMatch) {
      const allPricesInContainer = [];
      for (const container of priceContainerMatch) {
        // Find all numbers that look like prices
        const priceMatches = container.match(/[\d.,]+\s*(?:ден|MKD|денари)?/g);
        if (priceMatches) {
          for (const pm of priceMatches) {
            const price = extractPrice(pm);
            if (price >= 50 && price <= 100000 && !allPricesInContainer.includes(price)) {
              allPricesInContainer.push(price);
            }
          }
        }
      }

      // Sort descending - higher price is original
      allPricesInContainer.sort((a, b) => b - a);

      if (allPricesInContainer.length >= 2) {
        if (prices.original === 0) prices.original = allPricesInContainer[0];
        if (prices.sale === 0) prices.sale = allPricesInContainer[allPricesInContainer.length - 1];
      } else if (allPricesInContainer.length === 1) {
        // Only one price found - might not be on sale
        if (prices.sale === 0) prices.sale = allPricesInContainer[0];
      }
    }
  }

  return prices;
}

// Calculate discount percentage
function calculateDiscount(original, sale) {
  if (original <= 0 || sale <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

// Normalize image URL
function normalizeImageUrl(url, baseUrl) {
  if (!url) return '';
  // Clean up the URL
  url = url.trim();

  // Already absolute URL - return as is
  if (url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://')) {
    return url;
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Relative URL starting with /
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${url}`;
  }

  // Relative URL without /
  return `${baseUrl.replace(/\/$/, '')}/${url}`;
}

// Check if URL looks like a valid product image
function isValidProductImage(url) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // Skip placeholder/loading images
  const skipPatterns = [
    'placeholder', 'loading', 'blank', 'empty', 'default',
    'no-image', 'noimage', 'no_image', 'spinner', 'loader',
    'spacer', 'transparent', 'pixel', '1x1', 'data:image',
    'svg+xml', 'base64,', 'icon', 'logo', 'favicon'
  ];

  if (skipPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return false;
  }

  // Must have valid image extension or be from CDN
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const cdnPatterns = ['cdn', 'images', 'media', 'assets', 'static', 'img'];

  const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
  const isFromCdn = cdnPatterns.some(pattern => lowerUrl.includes(pattern));

  return hasValidExtension || isFromCdn;
}

// Extract all possible image URLs from a product HTML block
function extractImageUrls(productHtml, baseUrl) {
  const images = [];

  // Patterns for finding images (ordered by priority)
  const patterns = [
    // Data attributes for lazy loading (highest priority - these are the real images)
    /data-src="([^"]+)"/gi,
    /data-original="([^"]+)"/gi,
    /data-lazy="([^"]+)"/gi,
    /data-lazy-src="([^"]+)"/gi,
    /data-image="([^"]+)"/gi,
    /data-bg="([^"]+)"/gi,
    /data-srcset="([^"]+)"/gi,

    // Srcset (get the largest image)
    /srcset="([^"]+)"/gi,

    // Regular src (lower priority as it might be placeholder)
    /src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi,

    // Background image in style
    /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi,
    /background:\s*[^;]*url\(['"]?([^'")\s]+)['"]?\)/gi,

    // Content attribute (used in some frameworks)
    /content="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(productHtml)) !== null) {
      let url = match[1];

      // Handle srcset - get the largest image
      if (url.includes(',') && url.includes(' ')) {
        const srcsetParts = url.split(',').map(s => s.trim());
        // Get the last (usually largest) image
        const lastPart = srcsetParts[srcsetParts.length - 1];
        url = lastPart.split(' ')[0];
      }

      const normalizedUrl = normalizeImageUrl(url, baseUrl);
      if (isValidProductImage(normalizedUrl) && !images.includes(normalizedUrl)) {
        images.push(normalizedUrl);
      }
    }
  }

  return images;
}

// Extract best image from JSON-LD item
function extractJsonLdImage(item, baseUrl) {
  // Handle array of images
  if (Array.isArray(item.image)) {
    for (const img of item.image) {
      const url = typeof img === 'object' ? (img.url || img.contentUrl || img['@id']) : img;
      const normalized = normalizeImageUrl(url, baseUrl);
      if (isValidProductImage(normalized)) {
        return normalized;
      }
    }
  }

  // Handle single image (could be string or object)
  if (item.image) {
    const img = item.image;
    const url = typeof img === 'object' ? (img.url || img.contentUrl || img['@id']) : img;
    const normalized = normalizeImageUrl(url, baseUrl);
    if (isValidProductImage(normalized)) {
      return normalized;
    }
  }

  // Try other image properties
  const imageProps = ['thumbnail', 'primaryImage', 'mainImage', 'photo'];
  for (const prop of imageProps) {
    if (item[prop]) {
      const url = typeof item[prop] === 'object' ? item[prop].url : item[prop];
      const normalized = normalizeImageUrl(url, baseUrl);
      if (isValidProductImage(normalized)) {
        return normalized;
      }
    }
  }

  return '';
}

// Parse JSON-LD from HTML
function extractJsonLdProducts(html, shopId, shopName, baseUrl) {
  const products = [];
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = extractProductsFromData(data);

      for (const item of items) {
        if (!item.offers) continue;

        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const originalPrice = parseFloat(offer.highPrice || offer.price) || 0;
        const salePrice = parseFloat(offer.lowPrice || offer.price) || 0;

        // Extract image with improved logic
        const imageUrl = extractJsonLdImage(item, baseUrl);

        if (salePrice > 0 && originalPrice > salePrice && imageUrl) {
          products.push({
            id: `${shopId}-${item.sku || item.name || Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
            shopId,
            shopName,
            name: item.name || '',
            description: item.description || '',
            imageUrl,
            originalPrice,
            salePrice,
            discountPercentage: calculateDiscount(originalPrice, salePrice),
            currency: offer.priceCurrency || 'MKD',
            productUrl: item.url || baseUrl,
            affiliateUrl: `${item.url || baseUrl}?utm_source=stilix`,
            category: item.category || 'fashion',
            brand: typeof item.brand === 'object' ? item.brand.name : item.brand,
            inStock: offer.availability?.includes('InStock') ?? true,
            fetchedAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return products;
}

function extractProductsFromData(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.flatMap(extractProductsFromData);
  if (data['@type'] === 'Product') return [data];
  if (data['@type'] === 'ItemList' && data.itemListElement) {
    return data.itemListElement.filter(el => el.item?.['@type'] === 'Product').map(el => el.item);
  }
  if (data['@graph']) return extractProductsFromData(data['@graph']);
  return [];
}

// Parse HTML products
function extractHtmlProducts(html, shopId, shopName, baseUrl, category) {
  const products = [];

  // Find product containers - expanded patterns
  const productPatterns = [
    /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*product-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*product-box[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*item-product[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    /<div[^>]*data-product[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
  ];

  let productHtmls = [];
  for (const pattern of productPatterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > productHtmls.length) {
      productHtmls = matches.map(m => m[0]);
    }
  }

  for (const productHtml of productHtmls.slice(0, MAX_PRODUCTS_PER_SHOP)) {
    try {
      // Extract image using improved function
      const images = extractImageUrls(productHtml, baseUrl);
      const imageUrl = images[0] || '';

      // Extract name - more patterns
      const namePatterns = [
        /class="[^"]*product-(?:name|title)[^"]*"[^>]*>([^<]+)/i,
        /class="[^"]*name[^"]*"[^>]*>([^<]+)/i,
        /class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i,
        /<h[2-4][^>]*>[\s\S]*?<a[^>]*>([^<]+)/i,
        /<h[2-4][^>]*class="[^"]*"[^>]*>([^<]+)/i,
        /title="([^"]{10,})"/i,
        /alt="([^"]{10,})"/i,
      ];

      let name = '';
      for (const pattern of namePatterns) {
        const match = productHtml.match(pattern);
        if (match && match[1].trim().length > 5) {
          name = match[1].trim().replace(/\s+/g, ' ');
          break;
        }
      }

      // Extract prices using improved function
      const extractedPrices = extractPricesFromHtml(productHtml);
      let originalPrice = extractedPrices.original;
      let salePrice = extractedPrices.sale;

      // Validate prices
      if (salePrice > originalPrice && originalPrice > 0) {
        // Swap if sale price is higher (extraction error)
        [originalPrice, salePrice] = [salePrice, originalPrice];
      }

      // If only sale price found, skip (can't calculate discount)
      if (originalPrice === 0 && salePrice > 0) {
        originalPrice = salePrice;
        salePrice = 0;
      }

      // Extract URL - comprehensive patterns for product links
      const linkPatterns = [
        // Specific product page patterns - look for actual product URLs
        /href="(https?:\/\/[^"]*\/[a-z]+-[a-z0-9-]+-\d+[^"]*)"/i,
        /href="([^"]*\/product\/[^"]*)"/i,
        /href="([^"]*\/produkt\/[^"]*)"/i,
        /href="([^"]*\/p\/[^"]*)"/i,
        /href="([^"]*\/item\/[^"]*)"/i,
        /href="([^"]*\/artikal\/[^"]*)"/i,
        // Pattern with product ID in URL
        /href="([^"]*-p-\d+[^"]*)"/i,
        /href="([^"]*\/\d+\.html[^"]*)"/i,
        // Data attributes for product URL
        /data-url="([^"]+)"/i,
        /data-href="([^"]+)"/i,
        /data-product-url="([^"]+)"/i,
        // Generic href patterns (last resort) - only relative URLs
        /href="(\/[^"]*[a-z]+-[a-z0-9-]+[^"]*)"/i,
      ];

      let productUrl = baseUrl;
      for (const pattern of linkPatterns) {
        const match = productHtml.match(pattern);
        if (match) {
          let url = match[1].trim();

          // Skip invalid URLs
          if (url.includes('javascript:') || url.includes('#') ||
              url === '/' || url.length < 5 ||
              url.includes('login') || url.includes('cart') ||
              url.includes('wishlist') || url.includes('compare') ||
              url.includes('brend') || url.includes('brand') ||
              url.includes('kategori') || url.includes('category')) {
            continue;
          }

          // Check if URL contains another URL (malformed)
          const httpCount = (url.match(/https?:\/\//gi) || []).length;
          if (httpCount > 1) {
            // Extract just the last valid URL
            const lastUrlMatch = url.match(/(https?:\/\/[^"'\s]+)$/i);
            if (lastUrlMatch) {
              url = lastUrlMatch[1];
            } else {
              continue;
            }
          }

          productUrl = normalizeImageUrl(url, baseUrl);
          break;
        }
      }

      // Extract brand
      const brandMatch = productHtml.match(/class="[^"]*brand[^"]*"[^>]*>([^<]+)/i);
      const brand = brandMatch ? brandMatch[1].trim() : undefined;

      if (name && imageUrl && originalPrice > 0 && salePrice > 0 && originalPrice > salePrice) {
        products.push({
          id: `${shopId}-${name}-${salePrice}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().slice(0, 100),
          shopId,
          shopName,
          name,
          imageUrl,
          originalPrice,
          salePrice,
          discountPercentage: calculateDiscount(originalPrice, salePrice),
          currency: 'MKD',
          productUrl,
          affiliateUrl: `${productUrl}${productUrl.includes('?') ? '&' : '?'}utm_source=stilix`,
          category,
          brand,
          inStock: true,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Skip invalid product
    }
  }

  return products;
}

// Scrape a single shop
async function scrapeShop(shop) {
  console.log(`\nScraping ${shop.name}...`);
  const allProducts = [];
  const seenIds = new Set();

  for (const url of shop.urls) {
    try {
      console.log(`  Fetching: ${url}`);
      const html = await fetchUrl(url);

      // Try JSON-LD first
      let products = extractJsonLdProducts(html, shop.id, shop.name, url);
      const jsonLdWithImages = products.filter(p => p.imageUrl).length;
      console.log(`    Found ${products.length} products from JSON-LD (${jsonLdWithImages} with images)`);

      // Fallback to HTML parsing
      if (products.length === 0) {
        products = extractHtmlProducts(html, shop.id, shop.name, url, shop.category);
        const htmlWithImages = products.filter(p => p.imageUrl).length;
        console.log(`    Found ${products.length} products from HTML (${htmlWithImages} with images)`);
      }

      // Deduplicate
      for (const product of products) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          allProducts.push(product);
        }
      }
    } catch (error) {
      console.log(`    Error: ${error.message}`);
    }
  }

  const withImages = allProducts.filter(p => p.imageUrl).length;
  console.log(`  Total: ${allProducts.length} unique products (${withImages} with images)`);
  return allProducts;
}

// Main scraper function
async function runScraper() {
  console.log('='.repeat(60));
  console.log('Stilix Daily Scraper');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const allProducts = [];
  const results = [];

  for (const shop of SHOPS) {
    try {
      const products = await scrapeShop(shop);
      allProducts.push(...products);
      results.push({
        shopId: shop.id,
        shopName: shop.name,
        success: true,
        productCount: products.length,
      });
    } catch (error) {
      console.log(`  Failed: ${error.message}`);
      results.push({
        shopId: shop.id,
        shopName: shop.name,
        success: false,
        error: error.message,
      });
    }

    // Small delay between shops to be polite
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Count products with images
  const productsWithImages = allProducts.filter(p => p.imageUrl).length;

  // Save results
  const output = {
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    productsWithImages,
    shopResults: results,
    products: allProducts,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('\n' + '='.repeat(60));
  console.log(`Scraping complete!`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Products with images: ${productsWithImages} (${Math.round(productsWithImages/allProducts.length*100) || 0}%)`);
  console.log(`Output saved to: ${OUTPUT_FILE}`);
  console.log('='.repeat(60));

  // Print summary
  console.log('\nShop Summary:');
  for (const result of results) {
    const status = result.success ? `✓ ${result.productCount} products` : `✗ ${result.error}`;
    console.log(`  ${result.shopName}: ${status}`);
  }

  // Show sample products with images and links
  console.log('\nSample products:');
  const sampledProducts = allProducts.filter(p => p.imageUrl && p.productUrl).slice(0, 5);
  for (const product of sampledProducts) {
    console.log(`  - ${product.name.slice(0, 50)}`);
    console.log(`    Image: ${product.imageUrl}`);
    console.log(`    Link:  ${product.productUrl}`);
  }

  // Count products with valid URLs
  const withUrls = allProducts.filter(p => p.productUrl && p.productUrl !== p.shopId).length;
  console.log(`\nProducts with clickable links: ${withUrls}/${allProducts.length}`);
}

// Run the scraper
runScraper().catch(console.error);
