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

  // Format price in Macedonian format: 1.299 ден
  const formatPrice = (price: number): string => {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
      toValue: 0.98,
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
      Alert.alert('No Link', 'No link available to copy.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(url);
      } else {
        await Clipboard.setStringAsync(url);
      }
      Alert.alert('Copied!', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Could not copy link');
    }
  };

  const handleLikePress = () => {
    setIsLiked(!isLiked);
  };

  const savings = product.originalPrice - product.salePrice;
  const productUrl = getProductUrl();
  const isHotDeal = product.discountPercentage >= 40;

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web' && productUrl) {
      return (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-clickable]')) {
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
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[styles.container, style]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Image Section */}
          <View style={styles.imageSection}>
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            {imageError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="image-outline" size={48} color={colors.gray300} />
                <Text style={styles.errorText}>Image not available</Text>
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

            {/* Top Row - Discount & Like */}
            <View style={styles.imageOverlay}>
              <View style={[styles.discountBadge, isHotDeal && styles.hotDealBadge]}>
                {isHotDeal && <Ionicons name="flame" size={14} color="#FFF" style={styles.flameIcon} />}
                <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
              </View>

              <TouchableOpacity
                style={styles.likeButton}
                onPress={handleLikePress}
                data-clickable="true"
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isLiked ? colors.primary : '#666'}
                />
              </TouchableOpacity>
            </View>

            {/* Shop Badge */}
            <View style={styles.shopBadge}>
              <Text style={styles.shopBadgeText}>{product.shopName}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>

            {/* Brand if available */}
            {product.brand && (
              <Text style={styles.brandText}>{product.brand}</Text>
            )}

            {/* Price Row */}
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.salePrice}>{formatPrice(product.salePrice)}</Text>
                <Text style={styles.currency}>ден</Text>
              </View>
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)} ден</Text>
            </View>

            {/* Savings Badge */}
            <View style={styles.savingsBadge}>
              <Ionicons name="arrow-down-circle" size={14} color={colors.success} />
              <Text style={styles.savingsText}>Заштеди {formatPrice(savings)} ден</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={handlePress}
                data-clickable="true"
              >
                <Ionicons name="cart-outline" size={18} color="#FFF" />
                <Text style={styles.shopButtonText}>Купи</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyLink}
                data-clickable="true"
              >
                <Ionicons name="copy-outline" size={18} color={colors.gray600} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleCopyLink}
                data-clickable="true"
              >
                <Ionicons name="share-social-outline" size={18} color={colors.gray600} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  imageSection: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.gray400,
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hotDealBadge: {
    backgroundColor: '#FF6D00',
  },
  flameIcon: {
    marginRight: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  shopBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  shopBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsSection: {
    padding: 14,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 20,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 10,
  },
  salePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 3,
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductCard;
