import { test, expect } from '../fixtures/test-fixtures';

/**
 * Data-shape validation on the lot page.
 *
 * Different from spec 01: that one prints values; this one asserts on their
 * *type and format*. A favorites counter should always parse to an integer ≥ 0,
 * and a current bid should match a currency format. This is the kind of test
 * that catches a refactor that accidentally swaps two fields or drops the
 * currency symbol — defects that the user wouldn't necessarily report but
 * downstream systems would choke on.
 */
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
    expect(name.length, 'lot name should be at least 5 chars').toBeGreaterThan(5);

    const favorites = await lotPage.getFavoritesCount();
    expect(Number.isInteger(favorites)).toBe(true);
    expect(favorites).toBeGreaterThanOrEqual(0);

    const bidText = await lotPage.getCurrentBidText();
    // Accept European or US-style price formats: "€ 53", "$1,200.00", "£ 1.200"
    expect(bidText).toMatch(/[€$£]\s?\d[\d.,]*/);

    const bidAmount = await lotPage.getCurrentBidAmount();
    expect(bidAmount, 'bid amount should be positive').toBeGreaterThan(0);
  });
});
