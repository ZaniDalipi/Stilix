import { Product } from '../../types';
import {
  fetchWithProxy,
  extractPrice,
  calculateDiscount,
  generateProductId,
  normalizeImageUrl,
  ShopScraper,
} from '../scraperBase';

interface ScraperConfig {
  shopId: string;
  shopName: string;
  baseUrl: string;
  saleUrls: string[];
  affiliateParam?: string;
  defaultCategory?: string;
  currency?: string;
}

/**
 * Creates a generic scraper for e-commerce sites
 * Works with most standard e-commerce HTML structures
 */
export function createGenericScraper(config: ScraperConfig): ShopScraper {
  const {
    shopId,
    shopName,
    baseUrl,
    saleUrls,
    affiliateParam = 'ref=stilix',
    defaultCategory = 'fashion',
    currency = 'MKD',
  } = config;

  return {
    shopId,

    async isAvailable(): Promise<boolean> {
      try {
        const response = await fetch(baseUrl, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    },

    async scrape(): Promise<Product[]> {
      const products: Product[] = [];
      const seenIds = new Set<string>();

      for (const saleUrl of saleUrls) {
        try {
          const html = await fetchWithProxy(saleUrl);

          // Try to find JSON-LD structured data first (most reliable)
          const jsonLdProducts = extractJsonLdProducts(html, shopId, shopName, baseUrl, affiliateParam);
          for (const product of jsonLdProducts) {
            if (!seenIds.has(product.id)) {
              seenIds.add(product.id);
              products.push(product);
            }
          }

          // Try embedded JSON data
          const embeddedProducts = extractEmbeddedJsonProducts(html, shopId, shopName, baseUrl, affiliateParam);
          for (const product of embeddedProducts) {
            if (!seenIds.has(product.id)) {
              seenIds.add(product.id);
              products.push(product);
            }
          }

          // Fallback to HTML parsing
          if (products.length === 0) {
            const htmlProducts = extractHtmlProducts(html, shopId, shopName, baseUrl, affiliateParam, defaultCategory, currency);
            for (const product of htmlProducts) {
              if (!seenIds.has(product.id)) {
                seenIds.add(product.id);
                products.push(product);
              }
            }
          }
        } catch (error) {
          console.error(`Generic scraper error for ${shopName} at ${saleUrl}:`, error);
        }
      }

      return products;
    },
  };
}

function extractJsonLdProducts(
  html: string,
  shopId: string,
  shopName: string,
  baseUrl: string,
  affiliateParam: string
): Product[] {
  const products: Product[] = [];
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];

  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match
        .replace(/<script type="application\/ld\+json">/gi, '')
        .replace(/<\/script>/gi, '')
        .trim();

      const data = JSON.parse(jsonContent);
      const items = extractProductsFromJsonLd(data);

      for (const item of items) {
        const offers = item.offers as { highPrice?: string; lowPrice?: string; price?: string; priceCurrency?: string; availability?: string } | Array<{ highPrice?: string; lowPrice?: string; price?: string; priceCurrency?: string; availability?: string }> | null;
        const offer = offers ? (Array.isArray(offers) ? offers[0] : offers) : null;
        if (!offer) continue;

        const originalPrice = parseFloat(offer.highPrice || offer.price || '0') || 0;
        const salePrice = parseFloat(offer.lowPrice || offer.price || '0') || 0;

        if (salePrice > 0 && originalPrice > salePrice) {
          const productUrl = String(item.url || baseUrl);
          const itemName = String(item.name || '');
          const itemSku = String(item.sku || '');
          const itemDesc = item.description ? String(item.description) : undefined;
          const itemImage = item.image;
          const imageUrl = Array.isArray(itemImage) ? String(itemImage[0] || '') : String(itemImage || '');
          const itemCategory = item.category ? String(item.category) : undefined;
          const itemBrand = item.brand as { name?: string } | string | undefined;
          const brandName = typeof itemBrand === 'object' && itemBrand?.name ? itemBrand.name : (typeof itemBrand === 'string' ? itemBrand : undefined);

          products.push({
            id: generateProductId(shopId, itemSku || itemName),
            shopId,
            shopName,
            name: itemName,
            description: itemDesc,
            imageUrl: normalizeImageUrl(imageUrl, baseUrl),
            originalPrice,
            salePrice,
            discountPercentage: calculateDiscount(originalPrice, salePrice),
            currency: offer.priceCurrency || 'MKD',
            productUrl,
            affiliateUrl: `${productUrl}${productUrl.includes('?') ? '&' : '?'}${affiliateParam}`,
            category: itemCategory,
            brand: brandName,
            inStock: offer.availability?.includes('InStock') ?? true,
            fetchedAt: new Date(),
          });
        }
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return products;
}

function extractProductsFromJsonLd(data: unknown): Array<{ [key: string]: unknown }> {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.flatMap(item => extractProductsFromJsonLd(item));
  }

  const obj = data as { [key: string]: unknown };

  if (obj['@type'] === 'Product') {
    return [obj];
  }

  if (obj['@type'] === 'ItemList' && Array.isArray(obj.itemListElement)) {
    return (obj.itemListElement as Array<{ item?: { [key: string]: unknown } }>)
      .filter(el => el.item?.['@type'] === 'Product')
      .map(el => el.item!);
  }

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    return extractProductsFromJsonLd(obj['@graph']);
  }

  return [];
}

function extractEmbeddedJsonProducts(
  html: string,
  shopId: string,
  shopName: string,
  baseUrl: string,
  affiliateParam: string
): Product[] {
  const products: Product[] = [];

  // Common patterns for embedded product data
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/i,
    /var\s+products\s*=\s*(\[[\s\S]*?\]);/i,
    /var\s+productData\s*=\s*({[\s\S]*?});/i,
    /"products"\s*:\s*(\[[\s\S]*?\])/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : (data.products || data.items || []);

        for (const item of items) {
          const originalPrice = parseFloat(item.price || item.regular_price || item.originalPrice) || 0;
          const salePrice = parseFloat(item.special_price || item.sale_price || item.salePrice || item.finalPrice) || 0;

          if (item.name && salePrice > 0 && originalPrice > salePrice) {
            const productUrl = item.url || item.product_url || baseUrl;
            products.push({
              id: generateProductId(shopId, item.id || item.sku || item.name),
              shopId,
              shopName,
              name: item.name || item.title,
              description: item.description || item.short_description,
              imageUrl: normalizeImageUrl(item.image || item.thumbnail || item.imageUrl, baseUrl),
              originalPrice,
              salePrice,
              discountPercentage: calculateDiscount(originalPrice, salePrice),
              currency: item.currency || 'MKD',
              productUrl,
              affiliateUrl: `${productUrl}${productUrl.includes('?') ? '&' : '?'}${affiliateParam}`,
              category: item.category || item.categories?.[0],
              brand: item.brand,
              inStock: item.in_stock !== false && item.availability !== 'out_of_stock',
              fetchedAt: new Date(),
            });
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  return products;
}

function extractHtmlProducts(
  html: string,
  shopId: string,
  shopName: string,
  baseUrl: string,
  affiliateParam: string,
  defaultCategory: string,
  currency: string
): Product[] {
  const products: Product[] = [];

  // Find product containers
  const containerPatterns = [
    /<(?:div|article|li)[^>]*class="[^"]*(?:product-card|product-item|product-box|item-product)[^"]*"[^>]*>[\s\S]*?<\/(?:div|article|li)>/gi,
    /<div[^>]*data-product[^>]*>[\s\S]*?<\/div>/gi,
  ];

  let productHtmls: string[] = [];
  for (const pattern of containerPatterns) {
    const matches = html.match(pattern) || [];
    if (matches.length > productHtmls.length) {
      productHtmls = matches;
    }
  }

  for (const productHtml of productHtmls.slice(0, 100)) {
    try {
      // Extract image
      let imageUrl = '';
      const imgPatterns = [
        /data-src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
        /src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
        /data-lazy-src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
      ];

      for (const pattern of imgPatterns) {
        const match = productHtml.match(pattern);
        if (match && !match[1].includes('placeholder') && !match[1].includes('loading')) {
          imageUrl = normalizeImageUrl(match[1], baseUrl);
          break;
        }
      }

      // Extract name
      let name = '';
      const namePatterns = [
        /class="[^"]*product-(?:name|title)[^"]*"[^>]*>[\s\S]*?([^<]+)</i,
        /<h[2-4][^>]*>[\s\S]*?<a[^>]*>([^<]+)/i,
        /title="([^"]+)"/i,
        /alt="([^"]+)"/i,
      ];

      for (const pattern of namePatterns) {
        const match = productHtml.match(pattern);
        if (match) {
          name = match[1].trim().replace(/\s+/g, ' ');
          if (name.length > 5) break;
        }
      }

      // Extract prices
      const priceRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g;
      const priceMatches = [...productHtml.matchAll(priceRegex)];
      const prices = priceMatches
        .map(m => extractPrice(m[1]))
        .filter(p => p > 50)
        .sort((a, b) => b - a);

      const originalPrice = prices[0] || 0;
      const salePrice = prices.length > 1 ? prices[prices.length - 1] : 0;

      // Extract URL
      const linkMatch = productHtml.match(/href="([^"]+)"/i);
      const productUrl = linkMatch ? normalizeImageUrl(linkMatch[1], baseUrl) : baseUrl;

      if (name && imageUrl && originalPrice > 0 && salePrice > 0 && originalPrice > salePrice) {
        products.push({
          id: generateProductId(shopId, name + salePrice),
          shopId,
          shopName,
          name,
          imageUrl,
          originalPrice,
          salePrice,
          discountPercentage: calculateDiscount(originalPrice, salePrice),
          currency,
          productUrl,
          affiliateUrl: `${productUrl}${productUrl.includes('?') ? '&' : '?'}${affiliateParam}`,
          category: defaultCategory,
          inStock: true,
          fetchedAt: new Date(),
        });
      }
    } catch (e) {
      // Skip invalid product
    }
  }

  return products;
}

// Pre-configured scrapers for Macedonian fashion shops with correct URLs
export const buzzSneakersScraper = createGenericScraper({
  shopId: 'buzz_sneakers',
  shopName: 'Buzz Sneakers MK',
  baseUrl: 'https://www.buzzsneakers.mk',
  saleUrls: [
    'https://www.buzzsneakers.mk/mk/akcija/',
    'https://www.buzzsneakers.mk/mk/popust/',
    'https://www.buzzsneakers.com/MAK_mk/proizvodi/',
  ],
  affiliateParam: 'utm_source=stilix',
  defaultCategory: 'shoes',
});

export const reservedScraper = createGenericScraper({
  shopId: 'reserved_mk',
  shopName: 'Reserved MK',
  baseUrl: 'https://www.reserved.com/mk/mk/',
  saleUrls: [
    'https://www.reserved.com/mk/mk/spetsijalna-ponuda/',
    'https://www.reserved.com/mk/mk/spetsijalna-ponuda/zheni/',
    'https://www.reserved.com/mk/mk/spetsijalna-ponuda/mazhi/',
  ],
  affiliateParam: 'utm_source=stilix',
  defaultCategory: 'fashion',
});

export const houseScraper = createGenericScraper({
  shopId: 'house_mk',
  shopName: 'House MK',
  baseUrl: 'https://www.housebrand.com/mk/mk/',
  saleUrls: [
    'https://www.housebrand.com/mk/mk/spetsijalna-ponuda/',
    'https://www.housebrand.com/mk/mk/spetsijalna-ponuda-zheni/',
    'https://www.housebrand.com/mk/mk/spetsijalna-ponuda-mazhi/',
  ],
  affiliateParam: 'utm_source=stilix',
  defaultCategory: 'fashion',
});

export const croppScraper = createGenericScraper({
  shopId: 'cropp_mk',
  shopName: 'Cropp MK',
  baseUrl: 'https://www.cropp.com/mk/mk/',
  saleUrls: [
    'https://www.cropp.com/mk/mk/spetsijalna-ponuda/',
    'https://www.cropp.com/mk/mk/spetsijalna-ponuda-zheni/',
    'https://www.cropp.com/mk/mk/spetsijalna-ponuda-mazhi/',
  ],
  affiliateParam: 'utm_source=stilix',
  defaultCategory: 'fashion',
});

export const sinsayScraper = createGenericScraper({
  shopId: 'sinsay_mk',
  shopName: 'Sinsay MK',
  baseUrl: 'https://www.sinsay.com/mk/mk/',
  saleUrls: [
    'https://www.sinsay.com/mk/mk/spetsijalna-ponuda/',
    'https://www.sinsay.com/mk/mk/spetsijalna-ponuda-zheni/',
    'https://www.sinsay.com/mk/mk/spetsijalna-ponuda-mazhi/',
  ],
  affiliateParam: 'utm_source=stilix',
  defaultCategory: 'fashion',
});

export const officeShoesScraper = createGenericScraper({
  shopId: 'office_shoes',
  shopName: 'Office Shoes MK',
  baseUrl: 'https://www.officeshoes.mk',
  saleUrls: [
    'https://www.officeshoes.mk/popust/',
    'https://www.officeshoes.mk/akcija/',
    'https://www.officeshoes.mk/outlet/',
  ],
  affiliateParam: 'ref=stilix',
  defaultCategory: 'shoes',
});
