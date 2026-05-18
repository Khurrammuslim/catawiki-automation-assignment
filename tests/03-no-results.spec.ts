import { test, expect } from '../fixtures/test-fixtures';

test.describe('Catawiki — empty search results', () => {
  test('shows a graceful empty state for a blank search', async ({
    openHome,
    searchResultsPage,
  }) => {
    const emptySearch = ' ';
    await openHome.search(emptySearch);

    await expect(openHome.page).toHaveURL(/\/s\?|\/search/);

    const count = await searchResultsPage.count();
    const noResultsVisible = await searchResultsPage.noResultsMessage
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      count === 0 || noResultsVisible,
      `Expected zero results or an empty-state message, but found ${count} lot cards`,
    ).toBeTruthy();
  });
});