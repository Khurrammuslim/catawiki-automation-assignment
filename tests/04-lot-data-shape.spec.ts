import { test, expect } from '../fixtures/test-fixtures';

test.describe('Catawiki — lot detail data shape', () => {
  test('first lot exposes well-shaped name, favorites count and current bid', async ({
    openHome,
    searchResultsPage,
    lotPage,
  }) => {
    await openHome.search('train');
    await searchResultsPage.waitUntilLoaded();
    await searchResultsPage.openLotByIndex(0);
    await lotPage.waitUntilLoaded();

    const name = await lotPage.getName();
    expect(name.length).toBeGreaterThan(5);

    const favorites = await lotPage.getFavoritesCount();
    expect(Number.isInteger(favorites)).toBe(true);
    expect(favorites).toBeGreaterThanOrEqual(0);

    expect(await lotPage.getCurrentBidText()).toMatch(/[€$£]\s?\d[\d.,]*/);
    expect(await lotPage.getCurrentBidAmount()).toBeGreaterThan(0);
  });
});
