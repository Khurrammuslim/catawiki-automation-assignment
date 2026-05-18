import { test, expect } from '../fixtures/test-fixtures';

/**
 * Negative case: a blank space should yield a graceful
 * "no results" experience rather than an error page.
 *
 * Different from spec 01: this verifies the negative branch of the search
 * flow — important because it's the path users hit on typos, and a regression
 * here would silently degrade UX.
 */
test.describe('Catawiki — empty search results', () => {
  test('shows a graceful empty state for a blank search', async ({
    openHome,
    searchResultsPage,
  }) => {
    const emptySearch = ' ';
    await openHome.search(emptySearch);

    // The results URL still loads; we don't 404.
    await expect(openHome.page).toHaveURL(/\/s\?|\/search/);

    // The page should either show zero lot cards, an empty-state message,
    // or both. We accept any of these signals.
    const count = await searchResultsPage.count();
    const noResultsVisible = await searchResultsPage.noResultsMessage
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      count === 0 || noResultsVisible,
      `Expected zero results or a no-results message for "${emptySearch}", but found ${count} lot cards`,
    ).toBeTruthy();
  });
});
