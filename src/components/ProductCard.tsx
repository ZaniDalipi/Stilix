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
const CARD_WIDTH = (width - 36) / 2;

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

  const productUrl = getProductUrl();
  const isHotDeal = product.discountPercentage >= 40;

  const CardContent = (
    <View style={[styles.card, style]}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={28} color="#ccc" />
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
          {isHotDeal && <Ionicons name="flame" size={10} color="#fff" />}
          <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => setIsLiked(!isLiked)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? '#FF385C' : '#888'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.shop}>{product.shopName}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>{formatPrice(product.salePrice)} ден</Text>
        </View>
        <Text style={styles.oldPrice}>{formatPrice(product.originalPrice)} ден</Text>

        <TouchableOpacity style={styles.buyBtn} onPress={handlePress}>
          <Text style={styles.buyText}>Купи</Text>
        </TouchableOpacity>
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
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    minWidth: CARD_WIDTH - 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
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
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  hotDealBadge: {
    backgroundColor: '#FF6B00',
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    padding: 10,
  },
  shop: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF385C',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF385C',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
    marginBottom: 10,
  },
  buyBtn: {
    backgroundColor: '#FF385C',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProductCard;
