import { Product } from '../../types';
import {
  fetchWithProxy,
  extractPrice,
  calculateDiscount,
  generateProductId,
  normalizeImageUrl,
  ShopScraper,
} from '../scraperBase';

const SHOP_ID = 'anhoch';
const SHOP_NAME = 'Anhoch';
const BASE_URL = 'https://www.anhoch.com';
const SALE_URLS = [
  'https://www.anhoch.com/category/19446/outlet',
  'https://www.anhoch.com/category/19446/outlet?page=2',
];

/**
 * Anhoch Scraper
 * Scrapes sale products from outlet section
 */
export const anhochScraper: ShopScraper = {
  shopId: SHOP_ID,

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },

  async scrape(): Promise<Product[]> {
    const products: Product[] = [];
    const seenIds = new Set<string>();

    for (const saleUrl of SALE_URLS) {
      try {
        const html = await fetchWithProxy(saleUrl);

        // Anhoch product card patterns
        const productPatterns = [
          /<div[^>]*class="[^"]*product-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
          /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi,
          /<article[^>]*>[\s\S]*?<\/article>/gi,
        ];

        let allMatches: string[] = [];
        for (const pattern of productPatterns) {
          const matches = html.match(pattern) || [];
          allMatches = [...allMatches, ...matches];
        }

        for (const productHtml of allMatches.slice(0, 50)) {
          try {
            // Extract image
            const imgPatterns = [
              /data-src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
              /src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
              /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i,
            ];

            let imageUrl = '';
            for (const pattern of imgPatterns) {
              const match = productHtml.match(pattern);
              if (match && !match[1].includes('placeholder') && !match[1].includes('blank')) {
                imageUrl = normalizeImageUrl(match[1], BASE_URL);
                break;
              }
            }

            // Extract product name
            const namePatterns = [
              /class="[^"]*product-name[^"]*"[^>]*>([^<]+)/i,
              /class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i,
              /<h[234][^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i,
              /title="([^"]+)"/i,
            ];

            let name = '';
            for (const pattern of namePatterns) {
              const match = productHtml.match(pattern);
              if (match) {
                name = match[1].trim().replace(/\s+/g, ' ');
                break;
              }
            }

            // Extract prices
            const priceRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:MKD|ден|денари|лв)?/gi;
            const priceMatches = [...productHtml.matchAll(priceRegex)];
            const prices = priceMatches
              .map(m => extractPrice(m[1]))
              .filter(p => p > 50)
              .sort((a, b) => b - a);

            // Look for specific price classes
            const oldPriceMatch = productHtml.match(/class="[^"]*(?:old|crossed|regular)[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:[.,]\d{3})*)/i);
            const newPriceMatch = productHtml.match(/class="[^"]*(?:new|current|special)[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:[.,]\d{3})*)/i);

            let originalPrice = oldPriceMatch ? extractPrice(oldPriceMatch[1]) : prices[0] || 0;
            let salePrice = newPriceMatch ? extractPrice(newPriceMatch[1]) : prices[prices.length - 1] || 0;

            if (originalPrice < salePrice) {
              [originalPrice, salePrice] = [salePrice, originalPrice];
            }

            // Extract product URL
            const linkMatch = productHtml.match(/href="([^"]*\/product\/[^"]*)"/i) ||
                             productHtml.match(/href="(\/[^"]*\d+[^"]*)"/i);
            const productUrl = linkMatch ? normalizeImageUrl(linkMatch[1], BASE_URL) : saleUrl;

            // Extract brand
            const brandMatch = productHtml.match(/class="[^"]*brand[^"]*"[^>]*>([^<]+)/i) ||
                              productHtml.match(/data-brand="([^"]+)"/i);
            const brand = brandMatch ? brandMatch[1].trim() : undefined;

            // Determine category based on keywords
            const lowerName = name.toLowerCase();
            let category = 'fashion';
            if (lowerName.includes('патик') || lowerName.includes('обув') || lowerName.includes('shoe') || lowerName.includes('sneaker')) {
              category = 'shoes';
            } else if (lowerName.includes('јакна') || lowerName.includes('палто') || lowerName.includes('jacket')) {
              category = 'outerwear';
            } else if (lowerName.includes('маица') || lowerName.includes('кошула') || lowerName.includes('shirt')) {
              category = 'tops';
            }

            const productId = generateProductId(SHOP_ID, name + salePrice);

            if (name && imageUrl && originalPrice > 0 && salePrice > 0 &&
                originalPrice > salePrice && !seenIds.has(productId)) {
              seenIds.add(productId);
              products.push({
                id: productId,
                shopId: SHOP_ID,
                shopName: SHOP_NAME,
                name,
                imageUrl,
                originalPrice,
                salePrice,
                discountPercentage: calculateDiscount(originalPrice, salePrice),
                currency: 'MKD',
                productUrl,
                affiliateUrl: `${productUrl}${productUrl.includes('?') ? '&' : '?'}ref=stilix`,
                category,
                brand,
                inStock: true,
                fetchedAt: new Date(),
              });
            }
          } catch (e) {
            console.warn('Failed to parse Anhoch product:', e);
          }
        }
      } catch (error) {
        console.error(`Anhoch scraper error for ${saleUrl}:`, error);
      }
    }

    return products;
  },
};

export default anhochScraper;
