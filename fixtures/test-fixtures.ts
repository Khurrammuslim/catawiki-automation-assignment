import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { LotPage } from '../pages/LotPage';
import { applyStealth } from '../utils/stealth';

type Fixtures = {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  lotPage: LotPage;
  openHome: HomePage;
};

export const test = base.extend<Fixtures>({
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