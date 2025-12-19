export { lcWaikikiScraper } from './lcWaikikiScraper';
export { officeShoesScraper } from './officeShoesScraper';
export { anhochScraper } from './anhochScraper';
export {
  createGenericScraper,
  buzzSneakersScraper,
  sportikoScraper,
  setecScraper,
  kotonScraper,
  reservedScraper,
} from './genericScraper';

import { ShopScraper } from '../scraperBase';
import { lcWaikikiScraper } from './lcWaikikiScraper';
import { officeShoesScraper } from './officeShoesScraper';
import { anhochScraper } from './anhochScraper';
import {
  buzzSneakersScraper,
  sportikoScraper,
  setecScraper,
  kotonScraper,
  reservedScraper,
} from './genericScraper';

// All available scrapers
export const allScrapers: ShopScraper[] = [
  lcWaikikiScraper,
  officeShoesScraper,
  anhochScraper,
  buzzSneakersScraper,
  sportikoScraper,
  setecScraper,
  kotonScraper,
  reservedScraper,
];

// Get scraper by shop ID
export function getScraperByShopId(shopId: string): ShopScraper | undefined {
  return allScrapers.find(s => s.shopId === shopId);
}
