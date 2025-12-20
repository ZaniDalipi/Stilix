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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

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

  const CardContent = (
    <View style={[styles.card, style]}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
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
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => setIsLiked(!isLiked)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? '#FF385C' : '#666'}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.shop}>{product.shopName}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>{formatPrice(product.salePrice)} ден</Text>
          <Text style={styles.oldPrice}>{formatPrice(product.originalPrice)} ден</Text>
        </View>

        <View style={styles.savingsRow}>
          <Ionicons name="pricetag" size={12} color="#10B981" />
          <Text style={styles.savingsText}>Заштеди {formatPrice(savings)} ден</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.buyBtn} onPress={handlePress}>
            <Ionicons name="cart-outline" size={16} color="#fff" />
            <Text style={styles.buyText}>Купи</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
            <Ionicons name="copy-outline" size={16} color="#666" />
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
        style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
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
    <TouchableOpacity onPress={handlePress} activeOpacity={0.95} style={{ flex: 1 }}>
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
    backgroundColor: '#FF385C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  info: {
    padding: 12,
  },
  shop: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF385C',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 8,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF385C',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF385C',
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductCard;
