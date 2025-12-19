# Stilix - Macedonian Fashion Sale Aggregator

A modern, cross-platform Expo React Native app that aggregates fashion items on sale from Macedonian fashion shops.

## Features

- **Cross-Platform**: Runs on iOS, Android, and Web via Expo
- **Modern UI**: Clean, Pinterest/Airbnb inspired design with smooth animations
- **Smart Filtering**: Filter by shop, price range, discount percentage, and categories
- **Search**: Real-time search across product names, brands, and shops
- **Affiliate Links**: Opens products with affiliate tracking when available
- **Responsive Grid**: Adapts columns based on screen size (2 on mobile, 3-4 on web)
- **Pull to Refresh**: Refresh product data with pull gesture
- **Loading Skeletons**: Smooth loading states with shimmer animations

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)
- **Styling**: StyleSheet with modern design system
- **Icons**: @expo/vector-icons (Ionicons)

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ProductCard.tsx         # Product card with image, prices, discount badge
│   ├── ProductCardSkeleton.tsx # Loading skeleton animation
│   ├── FilterBar.tsx           # Shop and sort filters
│   ├── SearchBar.tsx           # Search input component
│   ├── PriceRangeFilter.tsx    # Price range filter with presets
│   ├── Header.tsx              # App header with logo
│   └── index.ts                # Component exports
├── screens/           # Screen components
│   ├── HomeScreen.tsx          # Main screen with product grid
│   └── index.ts
├── hooks/             # Custom React hooks
│   ├── useProducts.ts          # Product fetching and filtering logic
│   └── index.ts
├── types/             # TypeScript type definitions
│   └── index.ts                # Product, Shop, Filter types
├── data/              # Data sources
│   ├── shops.json              # Macedonian shop configurations
│   └── mockProducts.ts         # Sample product data
├── constants/         # App constants
│   └── theme.ts                # Colors, spacing, typography
└── utils/             # Utility functions
    ├── helpers.ts              # Price formatting, URL handling
    └── index.ts
```

## Included Shops

The app aggregates sales from these Macedonian fashion retailers:

- **Anhoch** - Multi-category retailer
- **H&M MK** - International fashion
- **Mango MK** - Women's fashion
- **Zara MK** - Fast fashion
- **LC Waikiki MK** - Affordable fashion
- **Reserved MK** - Polish fashion brand
- **Koton MK** - Turkish fashion
- **Office Shoes MK** - Footwear
- **Buzz Sneakers MK** - Sneakers & sportswear
- **Sportiko** - Sports apparel
- **Setec** - Electronics & lifestyle

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Stilix

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Configuration

### Adding New Shops

Edit `src/data/shops.json` to add new shops:

```json
{
  "id": "shop_id",
  "name": "Shop Name",
  "logo": "https://shop.com/logo.png",
  "website": "https://shop.com",
  "apiEndpoint": "https://api.shop.com/sales",  // Optional
  "rssUrl": "https://shop.com/feed.xml",        // Optional
  "affiliateBaseUrl": "https://shop.com",       // Optional
  "affiliateParam": "ref=stilix",               // Optional
  "category": "fashion",
  "currency": "MKD",
  "isActive": true
}
```

### Connecting Real APIs

Replace the mock data in `src/hooks/useProducts.ts` with actual API calls:

```typescript
const fetchProducts = async () => {
  const results = await Promise.all(
    activeShops.map(async (shop) => {
      const response = await fetch(shop.apiEndpoint);
      const data = await response.json();
      return normalizeProducts(data, shop);
    })
  );
  return results.flat();
};
```

## Filtering Options

- **By Shop**: Toggle individual shops on/off
- **By Price**: Preset ranges or custom min/max
- **By Discount**: Minimum discount percentage
- **By Category**: shoes, tops, bottoms, dresses, outerwear, accessories, sportswear
- **Sort Options**:
  - Biggest Discount (default)
  - Price: Low to High
  - Price: High to Low
  - Newest First

## Affiliate Marketing

Products display affiliate links when shops provide:
- `affiliateBaseUrl`: Base URL for affiliate links
- `affiliateParam`: Query parameter for tracking

Example affiliate URL: `https://shop.com/product?ref=stilix`

## Design System

### Colors
- Primary: `#FF385C` (Coral/Red)
- Secondary: `#00A699` (Teal)
- Discount Badge: `#E41E31` (Red)

### Typography
- Display: 34px
- Headings: 22-28px
- Body: 14-16px
- Caption: 10-12px

## License

MIT License
