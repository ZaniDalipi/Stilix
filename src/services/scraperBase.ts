import { Product, Shop } from '../types';

// CORS proxy options for fetching from websites
// In production, you should use your own proxy server
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

export interface ScraperResult {
  products: Product[];
  success: boolean;
  error?: string;
  shopId: string;
  scrapedAt: Date;
}

export interface ShopScraper {
  shopId: string;
  scrape: () => Promise<Product[]>;
  isAvailable: () => Promise<boolean>;
}

/**
 * Fetch HTML content through a CORS proxy
 */
export async function fetchWithProxy(url: string): Promise<string> {
  let lastError: Error | null = null;

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'mk,en;q=0.9',
        },
      });

      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Proxy ${proxy} failed:`, error);
    }
  }

  throw lastError || new Error('All proxies failed');
}

/**
 * Fetch JSON data through a CORS proxy
 */
export async function fetchJsonWithProxy<T>(url: string): Promise<T> {
  const html = await fetchWithProxy(url);
  return JSON.parse(html) as T;
}

/**
 * Extract price from text (handles MKD currency format)
 */
export function extractPrice(text: string): number {
  if (!text) return 0;
  // Remove currency symbols, spaces, and thousands separators
  const cleaned = text
    .replace(/[^0-9.,]/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(',', '.'); // Convert decimal separator
  return parseFloat(cleaned) || 0;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(original: number, sale: number): number {
  if (original <= 0 || sale <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

/**
 * Generate unique product ID
 */
export function generateProductId(shopId: string, identifier: string): string {
  return `${shopId}-${identifier.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
}

/**
 * Clean and normalize image URL
 */
export function normalizeImageUrl(url: string, baseUrl: string): string {
  if (!url) return '';

  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Relative URL
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${url}`;
  }

  // Relative without leading slash
  return `${baseUrl.replace(/\/$/, '')}/${url}`;
}

/**
 * Simple HTML parser to extract elements (works in React Native)
 */
export function parseHTML(html: string) {
  return {
    // Find all matches for a pattern
    querySelectorAll: (selector: string): string[] => {
      const results: string[] = [];

      // Handle class selector
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        const regex = new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'gi');
        let match;
        while ((match = regex.exec(html)) !== null) {
          results.push(match[0]);
        }
      }

      // Handle tag selector
      else {
        const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'gi');
        let match;
        while ((match = regex.exec(html)) !== null) {
          results.push(match[0]);
        }
      }

      return results;
    },

    // Extract attribute value
    getAttribute: (element: string, attr: string): string | null => {
      const regex = new RegExp(`${attr}=["']([^"']*)["']`, 'i');
      const match = element.match(regex);
      return match ? match[1] : null;
    },

    // Extract text content (strip HTML tags)
    getTextContent: (element: string): string => {
      return element.replace(/<[^>]+>/g, '').trim();
    },

    // Find elements between patterns
    extractBetween: (start: string, end: string): string[] => {
      const results: string[] = [];
      const regex = new RegExp(`${start}([\\s\\S]*?)${end}`, 'gi');
      let match;
      while ((match = regex.exec(html)) !== null) {
        results.push(match[1]);
      }
      return results;
    },
  };
}

/**
 * Delay utility for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
