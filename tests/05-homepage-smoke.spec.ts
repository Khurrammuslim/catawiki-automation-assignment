import { test, expect } from '../fixtures/test-fixtures';

/**
 * Pure homepage smoke — no search, no navigation. Fast (~1s) and runs across
 * all four browser projects to prove cross-engine compatibility.
 *
 * Different from spec 01: this is a non-interactive sanity check. It catches
 * "did the site even render?" regressions in <1s before the longer flow tests
 * spend 30s arriving at the same failure.
 */
test.describe('Catawiki — homepage smoke', () => {
  test('homepage loads with a working search input and reasonable page metadata @smoke', async ({
    openHome,
  }) => {
    // Title should mention the brand.
    await expect(openHome.page).toHaveTitle(/The Online Marketplace with Weekly Auctions/i);

    // Search input is the primary CTA — must be visible and editable.
    await expect(openHome.searchInput).toBeVisible();
    await expect(openHome.searchInput).toBeEditable();

    // No critical console errors blocking the shell. (Marketing scripts
    // sometimes log non-blocking warnings — we only assert no severe errors.)
    const severeErrors: string[] = [];
    openHome.page.on('pageerror', (err) => severeErrors.push(err.message));
    await openHome.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    expect(severeErrors, 'no severe page errors at load').toHaveLength(0);
  });
});
