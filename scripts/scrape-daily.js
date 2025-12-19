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

// Extract price from text
function extractPrice(text) {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
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
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${url}`;
  }
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

      // Extract prices
      const priceMatches = [...productHtml.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g)];
      const prices = priceMatches.map(m => extractPrice(m[1])).filter(p => p > 50).sort((a, b) => b - a);

      const originalPrice = prices[0] || 0;
      const salePrice = prices.length > 1 ? prices[prices.length - 1] : 0;

      // Extract URL - comprehensive patterns for product links
      const linkPatterns = [
        // Specific product page patterns
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
        // Generic href patterns (last resort)
        /href="(\/[^"]*[a-z]+-[a-z0-9-]+[^"]*)"/i,
        /href="(https?:\/\/[^"]+)"/i,
      ];

      let productUrl = baseUrl;
      for (const pattern of linkPatterns) {
        const match = productHtml.match(pattern);
        if (match) {
          const url = match[1];
          // Skip invalid URLs
          if (url.includes('javascript:') || url.includes('#') ||
              url === '/' || url.length < 5 ||
              url.includes('login') || url.includes('cart') ||
              url.includes('wishlist') || url.includes('compare')) {
            continue;
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
