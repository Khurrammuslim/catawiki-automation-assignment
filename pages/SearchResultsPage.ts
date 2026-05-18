import { Page, Locator, expect } from '@playwright/test';

/**
 * SearchResultsPage — list of auction lots returned for a keyword.
 *
 * Selector strategy: Catawiki's lot cards are wrapped in <a> tags whose href
 * starts with /en/l/ (the lot detail route). This is a stable signal — the URL
 * scheme survives most front-end refactors. We treat that pattern as the canonical
 * "this is a lot card" definition.
 */
export class SearchResultsPage {
  readonly page: Page;
  readonly lotCards: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Any link whose path starts with /l/ is a lot card. We narrow to visible
    // ones to skip preloaded but offscreen entries.
    this.lotCards = page.locator('a[href*="/l/"]').filter({ visible: true });

    // "No results" copy varies; use a generic regex.
    this.noResultsMessage = page.getByText(/no results|nothing found|no matches/i);
  }

  /**
   * Wait for the search results to be on screen.
   *
   * We assert two independent signals to avoid false positives:
   *   1. The URL contains the search path (catawiki uses /s? for search).
   *   2. At least one lot card is rendered.
   */
  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/s\?|\/search/);
    await expect(this.lotCards.first()).toBeVisible();
  }

  /** How many lot cards are currently visible. */
  async count(): Promise<number> {
    return this.lotCards.count();
  }

  /**
   * Click the Nth (0-indexed) lot card and wait for the lot detail page.
   *
   * "Second lot" in the assignment means index 1.
   */
  async openLotByIndex(index: number): Promise<void> {
    const card = this.lotCards.nth(index);
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await Promise.all([
      this.page.waitForURL(/\/l\//, { timeout: 15_000 }),
      card.click(),
    ]);
  }
}
