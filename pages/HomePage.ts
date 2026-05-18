import { Page, Locator, expect } from '@playwright/test';
import { acceptCookiesIfPresent } from '../utils/consent';

/**
 * HomePage — Catawiki landing page.
 *
 * Why POM: encapsulates selectors and user actions so tests read like business
 * intent ("search for 'train'") rather than DOM noise. When Catawiki refactors
 * the header, only this file changes.
 *
 * Locator strategy: we prefer accessibility-based locators (getByRole / getByPlaceholder)
 * because they survive class/ID changes and reflect what real users perceive.
 */
export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // The search field is a combobox/textbox with a placeholder containing "Search".
    // We use multiple strategies in order of preference for resilience.
    this.searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('combobox', { name: /search/i }))
      .or(page.getByRole('searchbox'))
      .first();

    // The magnifier-icon submit button next to the search input.
    this.searchButton = page
      .getByRole('button', { name: /search/i })
      .or(page.locator('button[type="submit"][aria-label*="search" i]'))
      .first();
  }

  /** Open the home page and dismiss the cookie banner if shown. */
  async open(): Promise<void> {
    await this.page.goto('/en/', { waitUntil: 'domcontentloaded' });
    await acceptCookiesIfPresent(this.page);
    // The search input proves the home shell rendered.
    await expect(this.searchInput).toBeVisible();
  }

  /**
   * Type a keyword and click the magnifier button.
   *
   * We deliberately click the button (not press Enter) because the assignment
   * specifies "click magnifier button within a search field".
   */
  async search(keyword: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }
}
