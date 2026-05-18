import { test, expect } from '../fixtures/test-fixtures';

test.describe('Catawiki — required scenario', () => {
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
      expect(await searchResultsPage.count()).toBeGreaterThanOrEqual(2);
    });

    await test.step('Click the second lot', async () => {
      await searchResultsPage.openLotByIndex(1);
    });

    await test.step('Verify lot page and read its values', async () => {
      await lotPage.waitUntilLoaded();

      const name = await lotPage.getName();
      const favorites = await lotPage.getFavoritesCount();
      const currentBid = await lotPage.getCurrentBidText();

      expect(name).not.toBe('');
      expect(favorites).toBeGreaterThanOrEqual(0);
      expect(currentBid).toMatch(/[€$£]/);

      console.log('--- Lot details ---');
      console.log(`Name:        ${name}`);
      console.log(`Favorites:   ${favorites}`);
      console.log(`Current bid: ${currentBid}`);
      console.log('-------------------');
    });
  });
});