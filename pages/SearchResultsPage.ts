import { Page, Locator, expect } from '@playwright/test';

export class SearchResultsPage {
  readonly page: Page;
  readonly lotCards: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.lotCards = page.locator('a[href*="/l/"]').filter({ visible: true });
    this.noResultsMessage = page.getByText(/no results|nothing found|no matches/i);
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/s\?|\/search/);
    await expect(this.lotCards.first()).toBeVisible();
  }

  async count(): Promise<number> {
    return this.lotCards.count();
  }

  async openLotByIndex(index: number): Promise<void> {
    const card = this.lotCards.nth(index);
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/l\//, { timeout: 15_000 }), card.click()]);
  }

  /** Returns the href of the first visible lot card. Throws if none are present. */
  async getFirstLotHref(): Promise<string> {
    const href = await this.lotCards.first().getAttribute('href');
    if (!href) throw new Error('No lot cards found on the search results page');
    return href;
  }
}