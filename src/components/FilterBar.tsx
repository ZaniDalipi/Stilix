import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { Shop } from '../types';

interface FilterBarProps {
  shops: Shop[];
  selectedShops: string[];
  onShopToggle: (shopId: string) => void;
  onClearFilters: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  shops,
  selectedShops,
  onShopToggle,
  onClearFilters,
  sortBy,
  onSortChange,
}) => {
  const sortOptions = [
    { value: 'discount', label: 'Biggest Discount', icon: 'pricetag' as const },
    { value: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' as const },
    { value: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' as const },
    { value: 'newest', label: 'Newest First', icon: 'time' as const },
  ];

  const hasActiveFilters = selectedShops.length > 0;

  return (
    <View style={styles.container}>
      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortContainer}
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortButton,
              sortBy === option.value && styles.sortButtonActive,
            ]}
            onPress={() => onSortChange(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={sortBy === option.value ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortBy === option.value && styles.sortButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Shop Filters */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Shops</Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={onClearFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              selectedShops.length === 0 && styles.chipActive,
            ]}
            onPress={onClearFilters}
          >
            <Text
              style={[
                styles.chipText,
                selectedShops.length === 0 && styles.chipTextActive,
              ]}
            >
              All Shops
            </Text>
          </TouchableOpacity>
          {shops
            .filter((shop) => shop.isActive)
            .map((shop) => {
              const isSelected = selectedShops.includes(shop.id);
              return (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => onShopToggle(shop.id)}
                >
                  <Text
                    style={[styles.chipText, isSelected && styles.chipTextActive]}
                  >
                    {shop.name}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.white}
                      style={styles.chipIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  sortButtonTextActive: {
    color: colors.white,
  },
  filterSection: {
    marginTop: spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  chipsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipIcon: {
    marginLeft: spacing.xs,
  },
});

export default FilterBar;
