import { Page, Locator, expect } from '@playwright/test';

/**
 * LotPage — the auction lot detail page.
 *
 * The assignment asks us to extract three values from this page:
 *   - lot's name (the main H1 title)
 *   - "favorites" counter (number next to the heart icon)
 *   - current bid (price under the "Current bid" label)
 *
 * Each getter returns a clean primitive (string / number) so test assertions
 * can stay readable. Parsing logic lives here, not in the test — the test should
 * not care that the favorites label might be "39" or " 39 " or "1.2k".
 */
export class LotPage {
  readonly page: Page;
  readonly title: Locator;
  readonly favoritesIndicator: Locator;
  readonly currentBidContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Lot title is the page's main H1.
    this.title = page.locator('h1').first();

    // The favorites counter sits next to a heart icon. We anchor to the heart
    // icon's container and read the sibling number. Multiple strategies for
    // resilience.
    this.favoritesIndicator = page
      .locator('[aria-label*="favorite" i]')
      .or(page.locator('button:has(svg)').filter({ hasText: /^\s*\d+(\.\d+)?[kKmM]?\s*$/ }))
      .first();

    // The current-bid container is anchored on the "Current bid" label.
    // We capture the surrounding region (a list-item / labelled section)
    // because the price sits next to the label, not inside it.
    this.currentBidContainer = page
      .locator(':has-text("Current bid")')
      .filter({ hasText: /€|\$|£/ })
      .first();
  }

  /** Wait for the lot page to be loaded with all key data visible. */
  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/l\//);
    await expect(this.title).toBeVisible();
  }

  /** The full lot name (trimmed). */
  async getName(): Promise<string> {
    const raw = await this.title.textContent();
    return (raw ?? '').trim();
  }

  /**
   * The favorites count as a number.
   *
   * Catawiki may render this as "39", " 39 ", or "1.2k" once a lot is popular.
   * We parse the first number we find; "1.2k" → 1200.
   */
  async getFavoritesCount(): Promise<number> {
    const raw = (await this.favoritesIndicator.textContent()) ?? '';
    const match = raw.match(/(\d+(?:\.\d+)?)\s*([kKmM]?)/);
    if (!match) {
      throw new Error(`Could not parse favorites counter from text: "${raw}"`);
    }
    const value = parseFloat(match[1]!);
    const suffix = match[2]?.toLowerCase();
    if (suffix === 'k') return Math.round(value * 1_000);
    if (suffix === 'm') return Math.round(value * 1_000_000);
    return Math.round(value);
  }

  /**
   * The current bid as a string ("€ 53") — kept as text so callers can match
   * exactly what the user sees. A parallel getCurrentBidAmount() returns the
   * numeric component if needed.
   */
  async getCurrentBidText(): Promise<string> {
    const raw = (await this.currentBidContainer.textContent()) ?? '';
    // Pull just the price portion (e.g. "€ 53") from a container that may
    // include the label "Current bid".
    const match = raw.match(/[€$£]\s?\d[\d.,]*/);
    return (match?.[0] ?? raw).trim();
  }

  /** Numeric value of the current bid (currency stripped). */
  async getCurrentBidAmount(): Promise<number> {
    const text = await this.getCurrentBidText();
    const match = text.match(/\d[\d.,]*/);
    if (!match) throw new Error(`Could not parse bid amount from "${text}"`);
    // Use a dot as the decimal separator; strip thousands separators.
    const normalised = match[0]!.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
    return parseFloat(normalised);
  }
}
