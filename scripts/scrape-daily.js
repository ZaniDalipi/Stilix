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
      'https://www.lcwaikiki.mk/mk-MK/MK/katalog/outlet',
      'https://www.lcwaikiki.mk/mk-MK/MK/katalog/popusti',
    ],
    category: 'fashion',
  },
  {
    id: 'reserved_mk',
    name: 'Reserved MK',
    urls: [
      'https://www.reserved.com/mk/mk/spetsijalna-ponuda/',
      'https://www.reserved.com/mk/mk/spetsijalna-ponuda/zheni/',
      'https://www.reserved.com/mk/mk/spetsijalna-ponuda/mazhi/',
    ],
    category: 'fashion',
  },
  {
    id: 'house_mk',
    name: 'House MK',
    urls: [
      'https://www.housebrand.com/mk/mk/spetsijalna-ponuda/',
      'https://www.housebrand.com/mk/mk/spetsijalna-ponuda-zheni/',
      'https://www.housebrand.com/mk/mk/spetsijalna-ponuda-mazhi/',
    ],
    category: 'fashion',
  },
  {
    id: 'cropp_mk',
    name: 'Cropp MK',
    urls: [
      'https://www.cropp.com/mk/mk/spetsijalna-ponuda/',
      'https://www.cropp.com/mk/mk/spetsijalna-ponuda-zheni/',
      'https://www.cropp.com/mk/mk/spetsijalna-ponuda-mazhi/',
    ],
    category: 'fashion',
  },
  {
    id: 'sinsay_mk',
    name: 'Sinsay MK',
    urls: [
      'https://www.sinsay.com/mk/mk/spetsijalna-ponuda/',
      'https://www.sinsay.com/mk/mk/spetsijalna-ponuda-zheni/',
      'https://www.sinsay.com/mk/mk/spetsijalna-ponuda-mazhi/',
    ],
    category: 'fashion',
  },
  {
    id: 'office_shoes',
    name: 'Office Shoes MK',
    urls: [
      'https://www.officeshoes.mk/popust/',
      'https://www.officeshoes.mk/akcija/',
      'https://www.officeshoes.mk/outlet/',
    ],
    category: 'shoes',
  },
  {
    id: 'buzz_sneakers',
    name: 'Buzz Sneakers MK',
    urls: [
      'https://www.buzzsneakers.mk/mk/akcija/',
      'https://www.buzzsneakers.mk/mk/popust/',
      'https://www.buzzsneakers.com/MAK_mk/proizvodi/',
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
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${url}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/${url}`;
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

        if (salePrice > 0 && originalPrice > salePrice) {
          products.push({
            id: `${shopId}-${item.sku || item.name || Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
            shopId,
            shopName,
            name: item.name || '',
            description: item.description || '',
            imageUrl: normalizeImageUrl(Array.isArray(item.image) ? item.image[0] : item.image, baseUrl),
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

  // Find product containers
  const productPatterns = [
    /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*product-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
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
      // Extract image
      const imgMatch = productHtml.match(/(?:data-src|src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
      const imageUrl = imgMatch ? normalizeImageUrl(imgMatch[1], baseUrl) : '';

      // Extract name
      const nameMatch = productHtml.match(/class="[^"]*product-(?:name|title)[^"]*"[^>]*>([^<]+)/i) ||
                       productHtml.match(/<h[2-4][^>]*>[\s\S]*?<a[^>]*>([^<]+)/i) ||
                       productHtml.match(/title="([^"]+)"/i);
      const name = nameMatch ? nameMatch[1].trim() : '';

      // Extract prices
      const priceMatches = [...productHtml.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g)];
      const prices = priceMatches.map(m => extractPrice(m[1])).filter(p => p > 50).sort((a, b) => b - a);

      const originalPrice = prices[0] || 0;
      const salePrice = prices.length > 1 ? prices[prices.length - 1] : 0;

      // Extract URL
      const linkMatch = productHtml.match(/href="([^"]+)"/i);
      const productUrl = linkMatch ? normalizeImageUrl(linkMatch[1], baseUrl) : baseUrl;

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
      console.log(`    Found ${products.length} products from JSON-LD`);

      // Fallback to HTML parsing
      if (products.length === 0) {
        products = extractHtmlProducts(html, shop.id, shop.name, url, shop.category);
        console.log(`    Found ${products.length} products from HTML`);
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

  console.log(`  Total: ${allProducts.length} unique products`);
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

  // Save results
  const output = {
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    shopResults: results,
    products: allProducts,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('\n' + '='.repeat(60));
  console.log(`Scraping complete!`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Output saved to: ${OUTPUT_FILE}`);
  console.log('='.repeat(60));

  // Print summary
  console.log('\nShop Summary:');
  for (const result of results) {
    const status = result.success ? `✓ ${result.productCount} products` : `✗ ${result.error}`;
    console.log(`  ${result.shopName}: ${status}`);
  }
}

// Run the scraper
runScraper().catch(console.error);
