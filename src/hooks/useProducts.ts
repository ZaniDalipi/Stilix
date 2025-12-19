import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Shop, FilterOptions, LoadingState } from '../types';
import { mockProducts } from '../data/mockProducts';
import shopsData from '../data/shops.json';

interface UseProductsResult {
  products: Product[];
  filteredProducts: Product[];
  shops: Shop[];
  loading: LoadingState;
  error: string | null;
  filters: FilterOptions;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  refreshProducts: () => Promise<void>;
  totalProducts: number;
  totalFilteredProducts: number;
}

const initialFilters: FilterOptions = {
  shops: [],
  minPrice: 0,
  maxPrice: 0,
  minDiscount: 0,
  categories: [],
  sortBy: 'discount',
  searchQuery: '',
};

export const useProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Get shops from JSON data
  const shops: Shop[] = useMemo(() => {
    return shopsData.shops as Shop[];
  }, []);

  // Fetch products from all shops
  const fetchProducts = useCallback(async () => {
    setLoading('loading');
    setError(null);

    try {
      // In production, this would make actual API calls to shop endpoints
      // For now, we use mock data to demonstrate the app
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

      // Simulate fetching from multiple shops
      const activeShops = shops.filter((shop) => shop.isActive);
      console.log(`Fetching products from ${activeShops.length} shops...`);

      // In a real implementation, you would:
      // 1. Loop through each shop
      // 2. Make a fetch request to shop.apiEndpoint or shop.rssUrl
      // 3. Parse the response and normalize to Product type
      // 4. Handle errors per-shop gracefully

      // For example:
      // const fetchPromises = activeShops.map(async (shop) => {
      //   try {
      //     if (shop.apiEndpoint) {
      //       const response = await fetch(shop.apiEndpoint);
      //       const data = await response.json();
      //       return normalizeProducts(data, shop);
      //     } else if (shop.rssUrl) {
      //       const response = await fetch(shop.rssUrl);
      //       const xml = await response.text();
      //       return parseRssToProducts(xml, shop);
      //     }
      //   } catch (error) {
      //     console.error(`Error fetching from ${shop.name}:`, error);
      //     return [];
      //   }
      // });
      // const results = await Promise.all(fetchPromises);
      // const allProducts = results.flat();

      setProducts(mockProducts);
      setLoading('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setLoading('error');
    }
  }, [shops]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.shopName.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
      );
    }

    // Filter by shops
    if (filters.shops.length > 0) {
      result = result.filter((product) =>
        filters.shops.includes(product.shopId)
      );
    }

    // Filter by price range
    if (filters.minPrice > 0) {
      result = result.filter((product) => product.salePrice >= filters.minPrice);
    }
    if (filters.maxPrice > 0) {
      result = result.filter((product) => product.salePrice <= filters.maxPrice);
    }

    // Filter by minimum discount
    if (filters.minDiscount > 0) {
      result = result.filter(
        (product) => product.discountPercentage >= filters.minDiscount
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter(
        (product) =>
          product.category && filters.categories.includes(product.category)
      );
    }

    // Sort products
    switch (filters.sortBy) {
      case 'discount':
        result.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case 'price_low':
        result.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case 'price_high':
        result.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
        );
        break;
      default:
        break;
    }

    return result;
  }, [products, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Refresh products
  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    filteredProducts,
    shops,
    loading,
    error,
    filters,
    updateFilters,
    refreshProducts,
    totalProducts: products.length,
    totalFilteredProducts: filteredProducts.length,
  };
};

export default useProducts;
