import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Dimensions,
  Platform,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Header,
  SearchBar,
  FilterBar,
  PriceRangeFilter,
  ProductCard,
  ProductCardSkeleton,
} from '../components';
import { useProducts } from '../hooks';
import { Product } from '../types';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const numColumns = isWeb && width > 768 ? (width > 1200 ? 4 : 3) : 2;

export const HomeScreen: React.FC = () => {
  const {
    filteredProducts,
    shops,
    loading,
    filters,
    updateFilters,
    refreshProducts,
    totalProducts,
    totalFilteredProducts,
    scrapeResults,
    usedMockData,
  } = useProducts();

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleShopToggle = useCallback(
    (shopId: string) => {
      const currentShops = filters.shops;
      const newShops = currentShops.includes(shopId)
        ? currentShops.filter((id) => id !== shopId)
        : [...currentShops, shopId];
      updateFilters({ shops: newShops });
    },
    [filters.shops, updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    updateFilters({
      shops: [],
      minPrice: 0,
      maxPrice: 0,
      minDiscount: 0,
      categories: [],
      searchQuery: '',
    });
  }, [updateFilters]);

  const handleSortChange = useCallback(
    (sortBy: string) => {
      updateFilters({ sortBy: sortBy as 'discount' | 'price_low' | 'price_high' | 'newest' });
    },
    [updateFilters]
  );

  const handleProductPress = useCallback((product: Product) => {
    // Opens the affiliate/product URL - handled by ProductCard
    console.log('Product pressed:', product.name);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        onPress={handleProductPress}
        style={styles.productCard}
      />
    ),
    [handleProductPress]
  );

  const renderSkeleton = useCallback(
    () => (
      <View style={styles.productCard}>
        <ProductCardSkeleton />
      </View>
    ),
    []
  );

  const renderEmptyState = useCallback(() => {
    if (loading === 'loading') {
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.skeletonItem}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={colors.gray300} />
        <Text style={styles.emptyTitle}>No deals found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your filters or search query
        </Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
          <Text style={styles.clearButtonText}>Clear all filters</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, handleClearFilters]);

  // Calculate scraping stats
  const successfulScrapes = scrapeResults.filter(r => r.success).length;
  const totalScrapes = scrapeResults.length;

  const renderHeader = useCallback(
    () => (
      <>
        {/* Data source indicator */}
        {loading === 'success' && (
          <View style={styles.dataSourceBanner}>
            <Ionicons
              name={usedMockData ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={14}
              color={usedMockData ? colors.warning : colors.success}
            />
            <Text style={[
              styles.dataSourceText,
              { color: usedMockData ? colors.warning : colors.success }
            ]}>
              {usedMockData
                ? 'Demo mode - Pull to refresh for live data'
                : `Live data from ${successfulScrapes}/${totalScrapes} shops`}
            </Text>
          </View>
        )}
        {/* Results count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {totalFilteredProducts} of {totalProducts} deals
          </Text>
          {filters.shops.length > 0 && (
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    ),
    [totalFilteredProducts, totalProducts, filters.shops.length, handleClearFilters, loading, usedMockData, successfulScrapes, totalScrapes]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Header
        title="Stilix"
        subtitle="Macedonian Fashion Deals"
        showLogo={true}
      />

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={(text) => updateFilters({ searchQuery: text })}
        onFilterPress={() => setShowFiltersModal(true)}
      />

      {/* Filter Bar */}
      <FilterBar
        shops={shops}
        selectedShops={filters.shops}
        onShopToggle={handleShopToggle}
        onClearFilters={handleClearFilters}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
      />

      {/* Price Range Filter */}
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onMinChange={(value) => updateFilters({ minPrice: value })}
        onMaxChange={(value) => updateFilters({ maxPrice: value })}
      />

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity
              onPress={() => setShowFiltersModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Minimum Discount */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Discount</Text>
              <View style={styles.discountOptions}>
                {[0, 20, 30, 40, 50].map((discount) => (
                  <TouchableOpacity
                    key={discount}
                    style={[
                      styles.discountOption,
                      filters.minDiscount === discount && styles.discountOptionActive,
                    ]}
                    onPress={() => updateFilters({ minDiscount: discount })}
                  >
                    <Text
                      style={[
                        styles.discountOptionText,
                        filters.minDiscount === discount &&
                          styles.discountOptionTextActive,
                      ]}
                    >
                      {discount === 0 ? 'Any' : `${discount}%+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories</Text>
              <View style={styles.categoryOptions}>
                {[
                  'shoes',
                  'tops',
                  'bottoms',
                  'dresses',
                  'outerwear',
                  'accessories',
                  'sportswear',
                ].map((category) => {
                  const isSelected = filters.categories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionActive,
                      ]}
                      onPress={() => {
                        const newCategories = isSelected
                          ? filters.categories.filter((c) => c !== category)
                          : [...filters.categories, category];
                        updateFilters({ categories: newCategories });
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          isSelected && styles.categoryOptionTextActive,
                        ]}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.applyButtonText}>
                Show {totalFilteredProducts} Results
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'flex-start',
  },
  productCard: {
    flex: 1 / numColumns,
    maxWidth: `${100 / numColumns}%`,
  },
  dataSourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dataSourceText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  resultsCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  clearFiltersText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  skeletonItem: {
    width: `${100 / numColumns}%`,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
  },
  clearButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  discountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  discountOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  discountOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discountOptionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  discountOptionTextActive: {
    color: colors.white,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  categoryOptionTextActive: {
    color: colors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default HomeScreen;
