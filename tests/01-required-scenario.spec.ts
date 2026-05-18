import { test, expect } from '../fixtures/test-fixtures';

/**
 * Required assignment scenario.
 *
 * Steps from the brief:
 *   1. Open https://www.catawiki.com/en/
 *   2. Type "train" in the search field, click magnifier
 *   3. Verify search results page is opened
 *   4. Click the second lot in search results
 *   5. Verify the lot page is opened
 *   6. Read lot's name, favorites counter, current bid
 *   7. Print those values to the console
 *
 * Each step has an explicit assertion so a failure points to the exact step.
 */
test.describe('Catawiki — required scenario (search → second lot → read values)', () => {
  test('searches for "train", opens the second lot, prints name / favorites / bid @smoke', async ({
    openHome,
    searchResultsPage,
    lotPage,
  }) => {
    await test.step('Search for "train"', async () => {
      await openHome.search('train');
    });

    await test.step('Verify search results page is opened', async () => {
      await searchResultsPage.waitUntilLoaded();
      const total = await searchResultsPage.count();
      expect(total, 'at least 2 lots required to click the second').toBeGreaterThanOrEqual(2);
    });

    await test.step('Click the second lot in the search results', async () => {
      await searchResultsPage.openLotByIndex(1); // 0-indexed → second card
    });

    await test.step('Verify lot page is opened and read its values', async () => {
      await lotPage.waitUntilLoaded();

      const name = await lotPage.getName();
      const favorites = await lotPage.getFavoritesCount();
      const currentBid = await lotPage.getCurrentBidText();

      // Sanity assertions before printing — proves the data is shaped right.
      expect(name, 'lot title should not be empty').not.toBe('');
      expect(favorites, 'favorites count should be a non-negative integer').toBeGreaterThanOrEqual(0);
      expect(currentBid, 'current bid should include a currency symbol').toMatch(/[€$£]/);

      // Print to console as the assignment requests.
      console.log('--- Lot details ---');
      console.log(`Name:        ${name}`);
      console.log(`Favorites:   ${favorites}`);
      console.log(`Current bid: ${currentBid}`);
      console.log('-------------------');
    });
  });
});
