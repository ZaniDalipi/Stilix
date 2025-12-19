export { lcWaikikiScraper } from './lcWaikikiScraper';
export { officeShoesScraper } from './officeShoesScraper';
export {
  createGenericScraper,
  buzzSneakersScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
  officeShoesScraper as genericOfficeShoesScraper,
} from './genericScraper';

import { ShopScraper } from '../scraperBase';
import { lcWaikikiScraper } from './lcWaikikiScraper';
import { officeShoesScraper } from './officeShoesScraper';
import {
  buzzSneakersScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
} from './genericScraper';

// All available scrapers for Macedonian fashion shops
export const allScrapers: ShopScraper[] = [
  lcWaikikiScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
  officeShoesScraper,
  buzzSneakersScraper,
];

// Get scraper by shop ID
export function getScraperByShopId(shopId: string): ShopScraper | undefined {
  return allScrapers.find(s => s.shopId === shopId);
}
