import { test, expect } from '../fixtures/test-fixtures';

test.describe('Catawiki — homepage smoke', () => {
  test('homepage loads with a working search input and no severe errors @smoke', async ({
    openHome,
  }) => {
    await expect(openHome.page).toHaveTitle(/The Online Marketplace with Weekly Auctions/i);
    await expect(openHome.searchInput).toBeVisible();
    await expect(openHome.searchInput).toBeEditable();

    const severeErrors: string[] = [];
    openHome.page.on('pageerror', (err) => severeErrors.push(err.message));
    await openHome.page.waitForLoadState('load', { timeout: 15_000 });
    expect(severeErrors).toHaveLength(0);
  });
});
