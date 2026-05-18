import { Page, Locator, expect } from '@playwright/test';

export class LotPage {
  readonly page: Page;
  readonly title: Locator;
  readonly favoritesIndicator: Locator;
  readonly currentBidContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1').first();
    this.favoritesIndicator = page
      .locator('[aria-label*="favorite" i]')
      .or(page.locator('button:has(svg)').filter({ hasText: /^\s*\d+(\.\d+)?[kKmM]?\s*$/ }))
      .first();
    this.currentBidContainer = page
      .locator(':has-text("Current bid")')
      .filter({ hasText: /€|\$|£/ })
      .first();
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/l\//);
    await expect(this.title).toBeVisible();
  }

  async getName(): Promise<string> {
    return ((await this.title.textContent()) ?? '').trim();
  }

  /** Parses "39", " 39 ", or "1.2k" → integer. */
  async getFavoritesCount(): Promise<number> {
    const raw = (await this.favoritesIndicator.textContent()) ?? '';
    const match = raw.match(/(\d+(?:\.\d+)?)\s*([kKmM]?)/);
    if (!match) throw new Error(`Could not parse favorites counter from text: "${raw}"`);
    const value = parseFloat(match[1]!);
    const suffix = match[2]?.toLowerCase();
    if (suffix === 'k') return Math.round(value * 1_000);
    if (suffix === 'm') return Math.round(value * 1_000_000);
    return Math.round(value);
  }

  /** Returns the bid as displayed, e.g. "€ 53". */
  async getCurrentBidText(): Promise<string> {
    const raw = (await this.currentBidContainer.textContent()) ?? '';
    const match = raw.match(/[€$£]\s?\d[\d.,]*/);
    return (match?.[0] ?? raw).trim();
  }

  /** Numeric bid value with currency stripped. */
  async getCurrentBidAmount(): Promise<number> {
    const text = await this.getCurrentBidText();
    const match = text.match(/\d[\d.,]*/);
    if (!match) throw new Error(`Could not parse bid amount from "${text}"`);
    const normalised = match[0]!.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
    return parseFloat(normalised);
  }
}