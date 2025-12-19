import { Product } from '../../types';
import {
  fetchWithProxy,
  extractPrice,
  calculateDiscount,
  generateProductId,
  normalizeImageUrl,
  ShopScraper,
} from '../scraperBase';

const SHOP_ID = 'office_shoes';
const SHOP_NAME = 'Office Shoes MK';
const BASE_URL = 'https://www.officeshoes.mk';
const SALE_URLS = [
  'https://www.officeshoes.mk/mk/akcija',
  'https://www.officeshoes.mk/mk/akcija/zenski',
  'https://www.officeshoes.mk/mk/akcija/mashi',
];

/**
 * Office Shoes MK Scraper
 * Scrapes sale products from their outlet/sale section
 */
export const officeShoesScraper: ShopScraper = {
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

      // Office Shoes typically uses standard e-commerce product listing
      // Look for product items in the listing
      const productRegex = /<article[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<\/article>/gi;
      const productMatches = html.match(productRegex) || [];

      // Alternative: look for product-item divs
      const altRegex = /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
      const altMatches = html.match(altRegex) || [];

      const allMatches = [...productMatches, ...altMatches];

      for (const productHtml of allMatches.slice(0, 60)) {
        try {
          // Extract image - multiple patterns
          const imgPatterns = [
            /data-src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
            /src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
            /data-lazy="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
          ];

          let imageUrl = '';
          for (const pattern of imgPatterns) {
            const match = productHtml.match(pattern);
            if (match) {
              imageUrl = normalizeImageUrl(match[1], BASE_URL);
              break;
            }
          }

          // Extract product name
          const namePatterns = [
            /class="[^"]*product-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i,
            /class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i,
            /title="([^"]+)"/i,
            /<h[23][^>]*>[\s\S]*?<a[^>]*>([^<]+)/i,
          ];

          let name = '';
          for (const pattern of namePatterns) {
            const match = productHtml.match(pattern);
            if (match) {
              name = match[1].trim();
              break;
            }
          }

          // Extract prices - look for old and new price
          const oldPriceMatch = productHtml.match(/class="[^"]*(?:old|regular|original)[^"]*price[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i);
          const newPriceMatch = productHtml.match(/class="[^"]*(?:new|special|sale)[^"]*price[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i);

          // Fallback: extract all prices
          const allPrices = productHtml.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:MKD|ден|денари)?/gi) || [];
          const prices = allPrices.map(p => extractPrice(p)).filter(p => p > 100).sort((a, b) => b - a);

          let originalPrice = oldPriceMatch ? extractPrice(oldPriceMatch[1]) : (prices[0] || 0);
          let salePrice = newPriceMatch ? extractPrice(newPriceMatch[1]) : (prices[prices.length - 1] || 0);

          // Ensure originalPrice > salePrice
          if (originalPrice < salePrice) {
            [originalPrice, salePrice] = [salePrice, originalPrice];
          }

          // Extract product URL
          const linkMatch = productHtml.match(/href="([^"]*\/[^"]*(?:product|item|p\/)[^"]*)"/i) ||
                           productHtml.match(/href="(https?:\/\/[^"]+)"/i);
          const productUrl = linkMatch ? normalizeImageUrl(linkMatch[1], BASE_URL) : saleUrl;

          // Extract brand if available
          const brandMatch = productHtml.match(/class="[^"]*brand[^"]*"[^>]*>([^<]+)/i);
          const brand = brandMatch ? brandMatch[1].trim() : undefined;

          if (name && imageUrl && originalPrice > 0 && salePrice > 0 && originalPrice > salePrice) {
            const productId = generateProductId(SHOP_ID, name + salePrice);
            if (!seenIds.has(productId)) {
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
                category: 'shoes',
                brand,
                inStock: true,
                fetchedAt: new Date(),
              });
            }
          }
        } catch (e) {
          console.warn('Failed to parse Office Shoes product:', e);
        }
      }

        // Also try to find JSON data embedded in the page
        const jsonMatch = html.match(/var\s+products\s*=\s*(\[[\s\S]*?\]);/i) ||
                         html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/i);

        if (jsonMatch && products.length === 0) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            const items = Array.isArray(data) ? data : data.products || [];

            for (const item of items) {
              if (item.price && item.special_price && item.name) {
                const productId = generateProductId(SHOP_ID, item.id || item.sku || item.name);
                if (!seenIds.has(productId)) {
                  seenIds.add(productId);
                  products.push({
                    id: productId,
                    shopId: SHOP_ID,
                    shopName: SHOP_NAME,
                    name: item.name,
                    description: item.description,
                    imageUrl: normalizeImageUrl(item.image || item.thumbnail, BASE_URL),
                    originalPrice: parseFloat(item.price),
                    salePrice: parseFloat(item.special_price),
                    discountPercentage: calculateDiscount(parseFloat(item.price), parseFloat(item.special_price)),
                    currency: 'MKD',
                    productUrl: item.url || saleUrl,
                    affiliateUrl: item.url ? `${item.url}?ref=stilix` : undefined,
                    category: 'shoes',
                    brand: item.brand,
                    inStock: item.in_stock !== false,
                    fetchedAt: new Date(),
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Failed to parse embedded JSON:', e);
          }
        }
      } catch (error) {
        console.error(`Office Shoes scraper error for ${saleUrl}:`, error);
      }
    }

    return products;
  },
};

export default officeShoesScraper;
