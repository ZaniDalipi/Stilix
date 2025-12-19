# Stilix - Macedonian Fashion Sale Aggregator

A modern, cross-platform Expo React Native app that aggregates fashion items on sale from Macedonian fashion shops with **real-time web scraping**.

## Features

- **Real-Time Scraping**: Fetches live product data from Macedonian fashion shop websites
- **Cross-Platform**: Runs on iOS, Android, and Web via Expo
- **Modern UI**: Clean, Pinterest/Airbnb inspired design with smooth animations
- **Smart Filtering**: Filter by shop, price range, discount percentage, and categories
- **Search**: Real-time search across product names, brands, and shops
- **Affiliate Links**: Opens products with affiliate tracking when available
- **Responsive Grid**: Adapts columns based on screen size (2 on mobile, 3-4 on web)
- **Pull to Refresh**: Refresh product data with pull gesture
- **Caching**: 5-minute cache to reduce load on shop websites
- **Fallback Data**: Gracefully falls back to demo data when scraping fails

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Scraping**: Custom HTML/JSON parsers with CORS proxy support
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
├── services/          # Scraping services
│   ├── scraperBase.ts          # Base scraper utilities and CORS proxy
│   ├── productService.ts       # Product fetching coordinator
│   └── scrapers/               # Individual shop scrapers
│       ├── lcWaikikiScraper.ts
│       ├── officeShoesScraper.ts
│       ├── anhochScraper.ts
│       ├── genericScraper.ts   # Configurable generic scraper
│       └── index.ts
├── types/             # TypeScript type definitions
│   └── index.ts                # Product, Shop, Filter types
├── data/              # Data sources
│   ├── shops.json              # Macedonian shop configurations
│   └── mockProducts.ts         # Fallback sample data
├── constants/         # App constants
│   └── theme.ts                # Colors, spacing, typography
└── utils/             # Utility functions
    ├── helpers.ts              # Price formatting, URL handling
    └── index.ts
```

## Scraper Architecture

The app uses a modular scraping system:

### How It Works

1. **CORS Proxy**: Uses public CORS proxies to fetch HTML from shop websites
2. **Multi-format Parsing**: Extracts products from:
   - JSON-LD structured data (most reliable)
   - Embedded JavaScript objects
   - HTML parsing as fallback
3. **Concurrent Fetching**: Scrapes multiple shops in parallel (3 at a time)
4. **Smart Caching**: Caches results for 5 minutes to reduce load
5. **Graceful Fallback**: Uses demo data if scraping fails

### Supported Shops

| Shop | Status | Method |
|------|--------|--------|
| LC Waikiki MK | Active | JSON-LD + HTML |
| Office Shoes MK | Active | HTML parsing |
| Anhoch | Active | HTML parsing |
| Buzz Sneakers MK | Active | Generic scraper |
| Sportiko | Active | Generic scraper |
| Setec | Active | Generic scraper |
| Koton MK | Active | Generic scraper |
| Reserved MK | Active | Generic scraper |

### Adding a New Shop Scraper

1. Create a new file in `src/services/scrapers/`:

```typescript
import { Product } from '../../types';
import { fetchWithProxy, ShopScraper } from '../scraperBase';

export const myShopScraper: ShopScraper = {
  shopId: 'my_shop',

  async isAvailable(): Promise<boolean> {
    // Check if shop is accessible
  },

  async scrape(): Promise<Product[]> {
    const html = await fetchWithProxy('https://myshop.mk/sale');
    // Parse HTML and extract products
    return products;
  },
};
```

2. Register in `src/services/scrapers/index.ts`
3. Add shop config to `src/data/shops.json`

### Using the Generic Scraper

For shops with standard e-commerce HTML:

```typescript
import { createGenericScraper } from './genericScraper';

export const newShopScraper = createGenericScraper({
  shopId: 'new_shop',
  shopName: 'New Shop MK',
  baseUrl: 'https://newshop.mk',
  saleUrls: ['https://newshop.mk/sale'],
  affiliateParam: 'ref=stilix',
  defaultCategory: 'fashion',
  currency: 'MKD',
});
```

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

### Shop Configuration

Edit `src/data/shops.json` to configure shops:

```json
{
  "id": "shop_id",
  "name": "Shop Name",
  "logo": "https://shop.com/logo.png",
  "website": "https://shop.com",
  "affiliateBaseUrl": "https://shop.com",
  "affiliateParam": "ref=stilix",
  "category": "fashion",
  "currency": "MKD",
  "isActive": true
}
```

### Scraper Configuration

In `src/services/productService.ts`:

```typescript
// Cache duration (default: 5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Max concurrent scrapers (default: 3)
const MAX_CONCURRENT_SCRAPERS = 3;

// Scraper timeout (default: 30 seconds)
const SCRAPER_TIMEOUT = 30000;

// Retry attempts (default: 2)
const RETRY_ATTEMPTS = 2;
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

Products automatically include affiliate URLs when shops provide:
- `affiliateBaseUrl`: Base URL for affiliate links
- `affiliateParam`: Query parameter for tracking

Example: `https://shop.com/product?ref=stilix`

A small link icon appears on products with affiliate URLs.

## Design System

### Colors
- Primary: `#FF385C` (Coral/Red)
- Secondary: `#00A699` (Teal)
- Success: `#00A699` (Teal)
- Warning: `#FFB400` (Amber)
- Discount Badge: `#E41E31` (Red)

### Typography
- Display: 34px
- Headings: 22-28px
- Body: 14-16px
- Caption: 10-12px

## Data Source Indicator

The app shows a status banner indicating the data source:
- **Green (Live data)**: Successfully scraped from shops
- **Amber (Demo mode)**: Using fallback demo data

Pull to refresh to retry live scraping.

## Legal Notice

This app scrapes **publicly available** sale information from shop websites. It does not:
- Access private or authenticated pages
- Store personal data
- Bypass any access controls

The scraping is rate-limited and cached to minimize impact on shop servers.

## License

MIT License
