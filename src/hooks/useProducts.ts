import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Shop, FilterOptions, LoadingState } from '../types';
import { fetchAllProducts, getShops, clearCache } from '../services/productService';
import { ScraperResult } from '../services/scraperBase';

interface UseProductsResult {
  products: Product[];
  filteredProducts: Product[];
  shops: Shop[];
  loading: LoadingState;
  error: string | null;
  filters: FilterOptions;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  refreshProducts: (forceRefresh?: boolean) => Promise<void>;
  totalProducts: number;
  totalFilteredProducts: number;
  scrapeResults: ScraperResult[];
  usedMockData: boolean;
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
  const [scrapeResults, setScrapeResults] = useState<ScraperResult[]>([]);
  const [usedMockData, setUsedMockData] = useState(false);

  // Get shops from configuration
  const shops: Shop[] = useMemo(() => {
    return getShops();
  }, []);

  // Fetch products from all shops using real scrapers
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    setLoading('loading');
    setError(null);

    try {
      console.log('Starting product fetch from Macedonian shops...');

      // Fetch products using the scraper service
      const result = await fetchAllProducts({
        forceRefresh,
        useMockFallback: true,
      });

      setProducts(result.products);
      setScrapeResults(result.results);
      setUsedMockData(result.usedMock);

      // Log scraping statistics
      const successfulShops = result.results.filter(r => r.success).length;
      const totalProducts = result.products.length;
      console.log(`Fetched ${totalProducts} products from ${successfulShops}/${result.results.length} shops`);

      if (result.usedMock) {
        console.log('Note: Using mock data as fallback');
      }

      // Check for any errors
      const failedShops = result.results.filter(r => !r.success);
      if (failedShops.length > 0 && !result.usedMock) {
        const failedNames = failedShops.map(r => r.shopId).join(', ');
        console.warn(`Some shops failed to scrape: ${failedNames}`);
      }

      setLoading('success');
    } catch (err) {
      console.error('Product fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setLoading('error');
    }
  }, []);

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

  // Refresh products (can force refresh to bypass cache)
  const refreshProducts = useCallback(async (forceRefresh = true) => {
    if (forceRefresh) {
      clearCache();
    }
    await fetchProducts(forceRefresh);
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
    scrapeResults,
    usedMockData,
  };
};

export default useProducts;
