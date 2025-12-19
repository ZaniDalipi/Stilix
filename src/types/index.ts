// Type definitions for Stilix - Macedonian Fashion Sale Aggregator

export interface Shop {
  id: string;
  name: string;
  logo: string;
  website: string;
  apiEndpoint?: string;
  rssUrl?: string;
  affiliateBaseUrl?: string;
  affiliateParam?: string;
  category: 'fashion' | 'shoes' | 'accessories' | 'multi';
  currency: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description?: string;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  currency: string;
  productUrl: string;
  affiliateUrl?: string;
  category?: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  fetchedAt: Date;
}

export interface FilterOptions {
  shops: string[];
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  categories: string[];
  sortBy: 'discount' | 'price_low' | 'price_high' | 'newest';
  searchQuery: string;
}

export interface ShopData {
  shops: Shop[];
  lastUpdated: string;
  version: string;
}

export interface FetchResult {
  products: Product[];
  error?: string;
  shopId: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
