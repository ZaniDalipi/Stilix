import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  style?: object;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatPrice = (price: number): string => {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getProductUrl = () => product.affiliateUrl || product.productUrl || '';

  const openProductLink = () => {
    const url = getProductUrl();
    if (!url) return;

    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open link');
      });
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    } else {
      openProductLink();
    }
  };

  const handleCopyLink = async () => {
    const url = getProductUrl();
    if (!url) return;

    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(url);
      } else {
        await Clipboard.setStringAsync(url);
      }
      Alert.alert('Copied!', 'Link copied');
    } catch {
      Alert.alert('Error', 'Could not copy');
    }
  };

  const savings = product.originalPrice - product.salePrice;
  const productUrl = getProductUrl();
  const isHotDeal = product.discountPercentage >= 40;

  const CardContent = (
    <View style={[styles.card, style]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#ddd" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Discount Badge */}
        <View style={[styles.discountBadge, isHotDeal && styles.hotDealBadge]}>
          {isHotDeal && <Ionicons name="flame" size={14} color="#fff" />}
          <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => setIsLiked(!isLiked)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#FF385C' : '#888'}
          />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Shop Name */}
        <View style={styles.shopRow}>
          <View style={styles.shopBadge}>
            <Text style={styles.shopText}>{product.shopName}</Text>
          </View>
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Brand */}
        {product.brand && (
          <Text style={styles.brandText}>{product.brand}</Text>
        )}

        {/* Prices */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{formatPrice(product.salePrice)}</Text>
            <Text style={styles.currency}>ден</Text>
          </View>
          <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)} ден</Text>
        </View>

        {/* Savings */}
        <View style={styles.savingsBadge}>
          <Ionicons name="trending-down" size={14} color="#059669" />
          <Text style={styles.savingsText}>Заштеда: {formatPrice(savings)} ден</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buyBtn} onPress={handlePress}>
            <Ionicons name="bag-handle-outline" size={18} color="#fff" />
            <Text style={styles.buyText}>Купи сега</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleCopyLink}>
            <Ionicons name="link-outline" size={18} color="#666" />
            <Text style={styles.iconBtnText}>Копирај</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleCopyLink}>
            <Ionicons name="share-social-outline" size={18} color="#666" />
            <Text style={styles.iconBtnText}>Сподели</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'web' && productUrl) {
    return (
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: CARD_WIDTH }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('[data-btn]')) {
            e.preventDefault();
          }
        }}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.95}
      style={{ flex: 1, minWidth: CARD_WIDTH }}
    >
      {CardContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    overflow: 'hidden',
    minWidth: CARD_WIDTH - 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  hotDealBadge: {
    backgroundColor: '#FF6B00',
  },
  discountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  likeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    padding: 16,
  },
  shopRow: {
    marginBottom: 8,
  },
  shopBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shopText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF385C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 6,
    minHeight: 44,
  },
  brandText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  priceSection: {
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF385C',
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF385C',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actions: {
    marginBottom: 12,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iconBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default ProductCard;
