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
const CARD_WIDTH = (width - 32) / 2;

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
            <Ionicons name="image-outline" size={24} color="#ccc" />
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
          {isHotDeal && <Ionicons name="flame" size={8} color="#fff" />}
          <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => setIsLiked(!isLiked)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={14}
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
    borderRadius: 8,
    margin: 4,
    overflow: 'hidden',
    minWidth: CARD_WIDTH - 8,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.1,
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
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  hotDealBadge: {
    backgroundColor: '#FF6B00',
  },
  discountText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  likeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    padding: 8,
  },
  shop: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF385C',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    lineHeight: 14,
    marginBottom: 4,
    minHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF385C',
  },
  oldPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 1,
    marginBottom: 6,
  },
  buyBtn: {
    backgroundColor: '#FF385C',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ProductCard;
