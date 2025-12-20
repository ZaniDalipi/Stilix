import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Product } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  style?: object;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;

  // Format price in Macedonian format: 1.299 ден
  const formatPrice = (price: number, currency: string): string => {
    const formatted = price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} ${currency === 'MKD' ? 'ден' : currency}`;
  };

  const getProductUrl = () => {
    return product.affiliateUrl || product.productUrl || '';
  };

  const openProductLink = () => {
    const url = getProductUrl();
    if (!url || url.length < 10) {
      if (Platform.OS !== 'web') {
        Alert.alert('No Link', 'This product does not have a valid link.');
      }
      return;
    }

    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((error) => {
        console.error('Error opening URL:', error);
        Alert.alert('Error', `Could not open: ${url}`);
      });
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(product);
      return;
    }
    openProductLink();
  };

  const handleCopyLink = async () => {
    const url = getProductUrl();
    if (!url || url.length < 10) {
      Alert.alert('No Link', 'This product does not have a valid link to copy.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(url);
      } else {
        await Clipboard.setStringAsync(url);
      }
      Alert.alert('✓ Copied!', 'Link copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      Alert.alert('Error', 'Could not copy link');
    }
  };

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(likeAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(likeAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    setIsLiked(!isLiked);
  };

  const savings = product.originalPrice - product.salePrice;
  const productUrl = getProductUrl();
  const isHotDeal = product.discountPercentage >= 50;

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web' && productUrl) {
      return (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button, [role="button"]')) {
              e.preventDefault();
            }
          }}
        >
          {children}
        </a>
      );
    }
    return <>{children}</>;
  };

  return (
    <CardWrapper>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[styles.container, style]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {imageError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="image-outline" size={40} color={colors.gray400} />
                <Text style={styles.errorText}>No Image</Text>
              </View>
            ) : (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            )}

            {/* Gradient overlay for better text visibility */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.03)']}
              style={styles.imageGradient}
            />

            {/* Discount Badge */}
            <View style={[styles.discountBadge, isHotDeal && styles.hotDealBadge]}>
              {isHotDeal && <Ionicons name="flame" size={12} color={colors.white} />}
              <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
            </View>

            {/* Like Button */}
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? colors.primary : colors.gray500}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Shop badge */}
            <View style={styles.shopBadge}>
              <Text style={styles.shopBadgeText}>{product.shopName}</Text>
            </View>
          </View>

          {/* Content Container */}
          <View style={styles.content}>
            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>

            {/* Brand */}
            {product.brand && (
              <Text style={styles.brand} numberOfLines={1}>
                {product.brand}
              </Text>
            )}

            {/* Price Container */}
            <View style={styles.priceContainer}>
              <Text style={styles.salePrice}>
                {formatPrice(product.salePrice, product.currency)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice, product.currency)}
              </Text>
            </View>

            {/* Savings pill */}
            <View style={styles.savingsPill}>
              <Ionicons name="pricetag" size={12} color={colors.success} />
              <Text style={styles.savingsText}>
                Save {formatPrice(savings, product.currency)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handlePress}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Ionicons name="bag-handle-outline" size={16} color={colors.white} />
                  <Text style={styles.viewButtonText}>Shop Now</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                <Ionicons name="link-outline" size={18} color={colors.gray600} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.medium,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: colors.gray100,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.discount,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hotDealBadge: {
    backgroundColor: colors.hotDeal,
  },
  discountText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  likeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    padding: spacing.sm,
    ...shadows.small,
  },
  shopBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  shopBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  content: {
    padding: spacing.md,
  },
  productName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * 1.4,
    marginBottom: spacing.xs,
  },
  brand: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  salePrice: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  originalPrice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  savingsText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  viewButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  viewButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard;
