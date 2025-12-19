import { Product, Shop } from '../types';
import { ScraperResult, delay } from './scraperBase';
import { allScrapers, getScraperByShopId } from './scrapers';
import { mockProducts } from '../data/mockProducts';
import shopsData from '../data/shops.json';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_SCRAPERS = 3;
const SCRAPER_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 2000; // 2 seconds

interface CacheEntry {
  products: Product[];
  timestamp: number;
  shopId: string;
}

// In-memory cache
const productCache: Map<string, CacheEntry> = new Map();

/**
 * Get all shops from configuration
 */
export function getShops(): Shop[] {
  return shopsData.shops as Shop[];
}

/**
 * Get active shops that have scrapers
 */
export function getActiveShopsWithScrapers(): Shop[] {
  const shops = getShops();
  return shops.filter(shop =>
    shop.isActive && allScrapers.some(s => s.shopId === shop.id)
  );
}

/**
 * Check if cache is valid for a shop
 */
function isCacheValid(shopId: string): boolean {
  const entry = productCache.get(shopId);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Get products from cache
 */
function getFromCache(shopId: string): Product[] | null {
  if (!isCacheValid(shopId)) return null;
  return productCache.get(shopId)?.products || null;
}

/**
 * Save products to cache
 */
function saveToCache(shopId: string, products: Product[]): void {
  productCache.set(shopId, {
    products,
    timestamp: Date.now(),
    shopId,
  });
}

/**
 * Clear cache for a specific shop or all
 */
export function clearCache(shopId?: string): void {
  if (shopId) {
    productCache.delete(shopId);
  } else {
    productCache.clear();
  }
}

/**
 * Scrape products from a single shop with timeout and retry
 */
async function scrapeShopWithRetry(shopId: string): Promise<ScraperResult> {
  const scraper = getScraperByShopId(shopId);

  if (!scraper) {
    return {
      products: [],
      success: false,
      error: `No scraper available for shop: ${shopId}`,
      shopId,
      scrapedAt: new Date(),
    };
  }

  // Check cache first
  const cachedProducts = getFromCache(shopId);
  if (cachedProducts) {
    console.log(`Using cached products for ${shopId} (${cachedProducts.length} items)`);
    return {
      products: cachedProducts,
      success: true,
      shopId,
      scrapedAt: new Date(),
    };
  }

  // Try scraping with retries
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`Scraping ${shopId} (attempt ${attempt}/${RETRY_ATTEMPTS})...`);

      // Create a promise that times out
      const timeoutPromise = new Promise<Product[]>((_, reject) => {
        setTimeout(() => reject(new Error('Scraper timeout')), SCRAPER_TIMEOUT);
      });

      const products = await Promise.race([
        scraper.scrape(),
        timeoutPromise,
      ]);

      if (products.length > 0) {
        saveToCache(shopId, products);
        console.log(`Successfully scraped ${products.length} products from ${shopId}`);
        return {
          products,
          success: true,
          shopId,
          scrapedAt: new Date(),
        };
      }
    } catch (error) {
      console.warn(`Scraping ${shopId} failed (attempt ${attempt}):`, error);
      if (attempt < RETRY_ATTEMPTS) {
        await delay(RETRY_DELAY * attempt);
      }
    }
  }

  // Return empty result if all attempts failed
  return {
    products: [],
    success: false,
    error: `Failed to scrape products after ${RETRY_ATTEMPTS} attempts`,
    shopId,
    scrapedAt: new Date(),
  };
}

/**
 * Scrape products from multiple shops concurrently
 */
async function scrapeMultipleShops(shopIds: string[]): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];

  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < shopIds.length; i += MAX_CONCURRENT_SCRAPERS) {
    const batch = shopIds.slice(i, i + MAX_CONCURRENT_SCRAPERS);
    const batchResults = await Promise.all(
      batch.map(shopId => scrapeShopWithRetry(shopId))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + MAX_CONCURRENT_SCRAPERS < shopIds.length) {
      await delay(500);
    }
  }

  return results;
}

/**
 * Fetch all products from all active shops
 * Returns real scraped data when available, falls back to mock data
 */
export async function fetchAllProducts(
  options: {
    forceRefresh?: boolean;
    shopIds?: string[];
    useMockFallback?: boolean;
  } = {}
): Promise<{
  products: Product[];
  results: ScraperResult[];
  usedMock: boolean;
}> {
  const {
    forceRefresh = false,
    shopIds,
    useMockFallback = true,
  } = options;

  // Clear cache if force refresh
  if (forceRefresh) {
    clearCache();
  }

  // Determine which shops to scrape
  const activeShops = getActiveShopsWithScrapers();
  const targetShopIds = shopIds || activeShops.map(s => s.id);

  console.log(`Starting scrape for ${targetShopIds.length} shops...`);

  // Scrape all target shops
  const results = await scrapeMultipleShops(targetShopIds);

  // Collect all products
  const allProducts: Product[] = [];
  let successfulScrapes = 0;

  for (const result of results) {
    if (result.success && result.products.length > 0) {
      allProducts.push(...result.products);
      successfulScrapes++;
    }
  }

  console.log(`Scraped ${allProducts.length} products from ${successfulScrapes}/${targetShopIds.length} shops`);

  // If no products scraped and mock fallback is enabled, use mock data
  if (allProducts.length === 0 && useMockFallback) {
    console.log('Using mock data as fallback');
    return {
      products: mockProducts,
      results,
      usedMock: true,
    };
  }

  // Combine with mock data for shops that failed
  if (useMockFallback && allProducts.length < 10) {
    const failedShopIds = results
      .filter(r => !r.success || r.products.length === 0)
      .map(r => r.shopId);

    const mockFallbackProducts = mockProducts.filter(p =>
      failedShopIds.includes(p.shopId)
    );

    if (mockFallbackProducts.length > 0) {
      console.log(`Adding ${mockFallbackProducts.length} mock products as fallback`);
      allProducts.push(...mockFallbackProducts);
    }
  }

  return {
    products: allProducts,
    results,
    usedMock: false,
  };
}

/**
 * Fetch products from a specific shop
 */
export async function fetchProductsFromShop(
  shopId: string,
  forceRefresh = false
): Promise<ScraperResult> {
  if (forceRefresh) {
    clearCache(shopId);
  }

  return scrapeShopWithRetry(shopId);
}

/**
 * Get all cached products
 */
export function getCachedProducts(): Product[] {
  const allProducts: Product[] = [];
  for (const entry of productCache.values()) {
    allProducts.push(...entry.products);
  }
  return allProducts;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalCachedProducts: number;
  cachedShops: string[];
  oldestEntry: Date | null;
} {
  const cachedShops: string[] = [];
  let oldestTimestamp: number | null = null;
  let totalProducts = 0;

  for (const [shopId, entry] of productCache.entries()) {
    cachedShops.push(shopId);
    totalProducts += entry.products.length;
    if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  }

  return {
    totalCachedProducts: totalProducts,
    cachedShops,
    oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
  };
}
