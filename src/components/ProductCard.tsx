import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const formatPrice = (price: number, currency: string): string => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const handlePress = async () => {
    if (onPress) {
      onPress(product);
      return;
    }

    // Get the URL to open
    const url = product.affiliateUrl || product.productUrl;

    if (!url || url.length < 10) {
      Alert.alert('No Link', 'This product does not have a valid link.');
      return;
    }

    try {
      // On web, just open the URL directly
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return;
      }

      // On mobile, use Linking
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', `Could not open: ${url}`);
    }
  };

  const handleLikePress = () => {
    setIsLiked(!isLiked);
  };

  const savings = product.originalPrice - product.salePrice;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.9}
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

        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={handleLikePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? colors.primary : colors.gray600}
          />
        </TouchableOpacity>

        {/* Affiliate Badge */}
        {product.affiliateUrl && (
          <View style={styles.affiliateBadge}>
            <Ionicons name="link" size={10} color={colors.white} />
          </View>
        )}
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        {/* Shop Name */}
        <Text style={styles.shopName} numberOfLines={1}>
          {product.shopName}
        </Text>

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

        {/* Savings */}
        <Text style={styles.savings}>
          Save {formatPrice(savings, product.currency)}
        </Text>

        {/* Sizes Preview */}
        {product.sizes && product.sizes.length > 0 && (
          <View style={styles.sizesContainer}>
            {product.sizes.slice(0, 4).map((size, index) => (
              <View key={index} style={styles.sizeTag}>
                <Text style={styles.sizeText}>{size}</Text>
              </View>
            ))}
            {product.sizes.length > 4 && (
              <Text style={styles.moreSizes}>+{product.sizes.length - 4}</Text>
            )}
          </View>
        )}

        {/* View Product Button */}
        <TouchableOpacity style={styles.viewButton} onPress={handlePress}>
          <Text style={styles.viewButtonText}>View Product</Text>
          <Ionicons name="open-outline" size={14} color={colors.white} />
        </TouchableOpacity>

        {/* Show link domain */}
        {(product.productUrl || product.affiliateUrl) && (
          <View style={styles.linkContainer}>
            <Ionicons name="link" size={12} color={colors.textMuted} />
            <Text style={styles.linkText} numberOfLines={1}>
              {(() => {
                try {
                  const url = product.affiliateUrl || product.productUrl;
                  return new URL(url).hostname.replace('www.', '');
                } catch {
                  return 'Open link';
                }
              })()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.discount,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
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
  affiliateBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.round,
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  shopName: {
    fontSize: fontSize.xs,
    color: colors.secondary,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * 1.3,
    marginBottom: spacing.xs,
  },
  brand: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  salePrice: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  originalPrice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  sizeTag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  sizeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  moreSizes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  viewButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  linkText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default ProductCard;
