import { test, expect } from '../fixtures/test-fixtures';

/**
 * Data-driven test — varies the search keyword across several plausible queries
 * to prove the search flow isn't brittle to a single input.
 *
 * Different from spec 01: this is parameterized, doesn't open a lot page, and
 * verifies the URL contains the query — a different signal than spec 01 uses.
 */
const keywords = ['train', 'watch', 'painting', 'guitar'] as const;

test.describe('Catawiki — search keyword variations', () => {
  for (const keyword of keywords) {
    test(`returns results for the keyword "${keyword}"`, async ({
      openHome,
      searchResultsPage,
    }) => {
      await openHome.search(keyword);
      await searchResultsPage.waitUntilLoaded();

      // The URL should preserve the query so the page is shareable.
      await expect(openHome.page).toHaveURL(new RegExp(`(q=${keyword}|/${keyword}/)`, 'i'));

      // We expect a healthy number of results for these popular categories.
      const count = await searchResultsPage.count();
      expect(count, `should find lots for "${keyword}"`).toBeGreaterThan(0);
    });
  }
});
