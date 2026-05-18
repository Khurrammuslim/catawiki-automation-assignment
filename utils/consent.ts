import { Page } from '@playwright/test';

/**
 * Catawiki shows a GDPR cookie consent banner on first visit (EU site).
 * If we don't dismiss it, clicks on the page can be intercepted.
 *
 * The banner UI may change over time, so we try a few resilient strategies
 * in order. We treat its absence as a non-error: it's already been dismissed
 * or wasn't shown on this run.
 */
export async function acceptCookiesIfPresent(page: Page, timeoutMs = 3_000): Promise<void> {
  const candidates = [
    page.getByRole('button', { name: /accept all/i }),
    page.getByRole('button', { name: /accept/i }),
    page.getByRole('button', { name: /agree/i }),
    page.getByTestId('uc-accept-all-button'),
    page.locator('#onetrust-accept-btn-handler'),
  ];

  for (const candidate of candidates) {
    try {
      await candidate.first().waitFor({ state: 'visible', timeout: timeoutMs });
      await candidate.first().click();
      return;
    } catch {
      // Try the next strategy
    }
  }
  // No banner found — fine, continue.
}
