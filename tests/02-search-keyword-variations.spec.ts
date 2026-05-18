import { test, expect } from '../fixtures/test-fixtures';

const keywords = ['train', 'watch', 'painting', 'guitar'] as const;

test.describe('Catawiki — search keyword variations', () => {
  for (const keyword of keywords) {
    test(`returns results for "${keyword}"`, async ({ openHome, searchResultsPage }) => {
      await openHome.search(keyword);
      await searchResultsPage.waitUntilLoaded();

      await expect(openHome.page).toHaveURL(new RegExp(`(q=${keyword}|/${keyword}/)`, 'i'));
      expect(await searchResultsPage.count()).toBeGreaterThan(0);
    });
  }
});
