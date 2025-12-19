import { Product } from '../../types';
import {
  fetchWithProxy,
  extractPrice,
  calculateDiscount,
  generateProductId,
  normalizeImageUrl,
  ShopScraper,
} from '../scraperBase';

const SHOP_ID = 'lc_waikiki';
const SHOP_NAME = 'LC Waikiki MK';
const BASE_URL = 'https://www.lcwaikiki.mk';
const SALE_URL = 'https://www.lcwaikiki.mk/mk-MK/MK/outlet';

/**
 * LC Waikiki MK Scraper
 * Scrapes sale products from the outlet section
 */
export const lcWaikikiScraper: ShopScraper = {
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

    try {
      const html = await fetchWithProxy(SALE_URL);

      // LC Waikiki uses JSON-LD for product data
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);

      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonContent = match
              .replace(/<script type="application\/ld\+json">/gi, '')
              .replace(/<\/script>/gi, '')
              .trim();

            const data = JSON.parse(jsonContent);

            if (data['@type'] === 'Product' || (Array.isArray(data) && data[0]?.['@type'] === 'Product')) {
              const items = Array.isArray(data) ? data : [data];

              for (const item of items) {
                if (item['@type'] === 'Product' && item.offers) {
                  const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                  const originalPrice = parseFloat(offer.highPrice || offer.price) || 0;
                  const salePrice = parseFloat(offer.lowPrice || offer.price) || 0;

                  if (salePrice > 0 && originalPrice > salePrice) {
                    products.push({
                      id: generateProductId(SHOP_ID, item.sku || item.name),
                      shopId: SHOP_ID,
                      shopName: SHOP_NAME,
                      name: item.name,
                      description: item.description,
                      imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
                      originalPrice,
                      salePrice,
                      discountPercentage: calculateDiscount(originalPrice, salePrice),
                      currency: 'MKD',
                      productUrl: item.url || SALE_URL,
                      affiliateUrl: item.url ? `${item.url}?utm_source=stilix` : undefined,
                      category: item.category || 'fashion',
                      brand: 'LC Waikiki',
                      inStock: offer.availability?.includes('InStock') ?? true,
                      fetchedAt: new Date(),
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Failed to parse JSON-LD:', e);
          }
        }
      }

      // Fallback: Parse HTML product cards
      if (products.length === 0) {
        // Look for product cards in HTML
        const productMatches = html.match(/<div[^>]*class="[^"]*product-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];

        for (const productHtml of productMatches.slice(0, 50)) {
          try {
            // Extract image
            const imgMatch = productHtml.match(/src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
            const imageUrl = imgMatch ? normalizeImageUrl(imgMatch[1], BASE_URL) : '';

            // Extract name
            const nameMatch = productHtml.match(/class="[^"]*product-name[^"]*"[^>]*>([^<]+)/i) ||
                             productHtml.match(/title="([^"]+)"/i);
            const name = nameMatch ? nameMatch[1].trim() : '';

            // Extract prices
            const priceMatches = productHtml.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:MKD|ден)/gi) || [];
            const prices = priceMatches.map(p => extractPrice(p)).filter(p => p > 0).sort((a, b) => b - a);

            // Extract product URL
            const linkMatch = productHtml.match(/href="([^"]*\/product[^"]*)"/i);
            const productUrl = linkMatch ? normalizeImageUrl(linkMatch[1], BASE_URL) : SALE_URL;

            if (name && imageUrl && prices.length >= 2) {
              const originalPrice = prices[0];
              const salePrice = prices[prices.length - 1];

              products.push({
                id: generateProductId(SHOP_ID, name),
                shopId: SHOP_ID,
                shopName: SHOP_NAME,
                name,
                imageUrl,
                originalPrice,
                salePrice,
                discountPercentage: calculateDiscount(originalPrice, salePrice),
                currency: 'MKD',
                productUrl,
                affiliateUrl: `${productUrl}?utm_source=stilix`,
                brand: 'LC Waikiki',
                inStock: true,
                fetchedAt: new Date(),
              });
            }
          } catch (e) {
            console.warn('Failed to parse product card:', e);
          }
        }
      }
    } catch (error) {
      console.error('LC Waikiki scraper error:', error);
    }

    return products;
  },
};

export default lcWaikikiScraper;
