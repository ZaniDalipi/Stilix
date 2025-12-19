export { lcWaikikiScraper } from './lcWaikikiScraper';
export { officeShoesScraper } from './officeShoesScraper';
export {
  createGenericScraper,
  buzzSneakersScraper,
  kotonScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
  defactoScraper,
  massScraper,
} from './genericScraper';

import { ShopScraper } from '../scraperBase';
import { lcWaikikiScraper } from './lcWaikikiScraper';
import { officeShoesScraper } from './officeShoesScraper';
import {
  buzzSneakersScraper,
  kotonScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
  defactoScraper,
  massScraper,
} from './genericScraper';

// All available scrapers for fashion shops
export const allScrapers: ShopScraper[] = [
  lcWaikikiScraper,
  officeShoesScraper,
  buzzSneakersScraper,
  kotonScraper,
  reservedScraper,
  houseScraper,
  croppScraper,
  sinsayScraper,
  defactoScraper,
  massScraper,
];

// Get scraper by shop ID
export function getScraperByShopId(shopId: string): ShopScraper | undefined {
  return allScrapers.find(s => s.shopId === shopId);
}
