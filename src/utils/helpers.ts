import { Linking, Platform } from 'react-native';
import { Product, Shop } from '../types';

/**
 * Format a price with currency
 */
export const formatPrice = (price: number, currency: string = 'MKD'): string => {
  return `${price.toLocaleString('mk-MK')} ${currency}`;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  salePrice: number
): number => {
  if (originalPrice <= 0) return 0;
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Build affiliate URL from product URL
 */
export const buildAffiliateUrl = (
  productUrl: string,
  shop: Shop
): string | undefined => {
  if (!shop.affiliateBaseUrl || !shop.affiliateParam) {
    return undefined;
  }

  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}${shop.affiliateParam}`;
};

/**
 * Open URL in browser
 */
export const openUrl = async (url: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return true;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error opening URL:', error);
    return false;
  }
};

/**
 * Open product URL (affiliate or regular)
 */
export const openProductUrl = async (product: Product): Promise<boolean> => {
  const url = product.affiliateUrl || product.productUrl;
  return openUrl(url);
};

/**
 * Get savings amount
 */
export const getSavings = (product: Product): number => {
  return product.originalPrice - product.salePrice;
};

/**
 * Format savings text
 */
export const formatSavings = (product: Product): string => {
  const savings = getSavings(product);
  return `Save ${formatPrice(savings, product.currency)}`;
};

/**
 * Group products by shop
 */
export const groupProductsByShop = (
  products: Product[]
): Record<string, Product[]> => {
  return products.reduce((acc, product) => {
    if (!acc[product.shopId]) {
      acc[product.shopId] = [];
    }
    acc[product.shopId].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
};

/**
 * Get unique categories from products
 */
export const getUniqueCategories = (products: Product[]): string[] => {
  const categories = new Set(
    products.map((p) => p.category).filter(Boolean) as string[]
  );
  return Array.from(categories).sort();
};

/**
 * Get unique brands from products
 */
export const getUniqueBrands = (products: Product[]): string[] => {
  const brands = new Set(
    products.map((p) => p.brand).filter(Boolean) as string[]
  );
  return Array.from(brands).sort();
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
