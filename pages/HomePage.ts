import { Page, Locator, expect } from '@playwright/test';
import { acceptCookiesIfPresent } from '../utils/consent';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('combobox', { name: /search/i }))
      .or(page.getByRole('searchbox'))
      .first();
    this.searchButton = page
      .getByRole('button', { name: /search/i })
      .or(page.locator('button[type="submit"][aria-label*="search" i]'))
      .first();
  }

  async open(): Promise<void> {
    await this.page.goto('/en/', { waitUntil: 'domcontentloaded' });
    await acceptCookiesIfPresent(this.page);
    await expect(this.searchInput).toBeVisible();
  }

  async search(keyword: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }
}