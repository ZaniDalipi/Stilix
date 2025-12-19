import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface ProductCardSkeletonProps {
  style?: object;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const shimmerStyle = {
    opacity: shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.image, shimmerStyle]} />
      <View style={styles.content}>
        <Animated.View style={[styles.shopName, shimmerStyle]} />
        <Animated.View style={[styles.productName, shimmerStyle]} />
        <Animated.View style={[styles.productNameLine2, shimmerStyle]} />
        <View style={styles.priceContainer}>
          <Animated.View style={[styles.salePrice, shimmerStyle]} />
          <Animated.View style={[styles.originalPrice, shimmerStyle]} />
        </View>
        <Animated.View style={[styles.savings, shimmerStyle]} />
        <View style={styles.sizesContainer}>
          {[1, 2, 3, 4].map((_, index) => (
            <Animated.View key={index} style={[styles.sizeTag, shimmerStyle]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    margin: spacing.xs,
    ...shadows.medium,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray200,
  },
  content: {
    padding: spacing.md,
  },
  shopName: {
    width: 60,
    height: 10,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
  productName: {
    width: '90%',
    height: 14,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.xs,
  },
  productNameLine2: {
    width: '60%',
    height: 14,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  salePrice: {
    width: 80,
    height: 18,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
  },
  originalPrice: {
    width: 60,
    height: 14,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
    alignSelf: 'center',
  },
  savings: {
    width: 100,
    height: 10,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.sm,
  },
  sizesContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sizeTag: {
    width: 28,
    height: 20,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.xs,
  },
});

export default ProductCardSkeleton;
