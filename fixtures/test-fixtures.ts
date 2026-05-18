import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { LotPage } from '../pages/LotPage';
import { applyStealth } from '../utils/stealth';

/**
 * Custom fixtures.
 *
 * `context` is overridden to install the stealth init script on every test —
 * Catawiki sits behind Akamai Bot Manager, which blocks Playwright's default
 * fingerprint. Doing this once at the fixture level means every spec inherits
 * the protection without ceremony.
 *
 * Page objects are exposed as direct fixtures so tests can declare exactly
 * which ones they need; the runtime injects fresh instances per test.
 * `openHome` is a convenience fixture that pre-navigates and dismisses
 * cookie consent.
 */
type Fixtures = {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  lotPage: LotPage;
  openHome: HomePage;
};

export const test = base.extend<Fixtures>({
  // Install stealth on every browser context created for these tests.
  context: async ({ context }, use) => {
    await applyStealth(context);
    await use(context);
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  lotPage: async ({ page }, use) => {
    await use(new LotPage(page));
  },
  openHome: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.open();
    await use(home);
  },
});

export { expect } from '@playwright/test';
