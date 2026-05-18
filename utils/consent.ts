import { Page } from '@playwright/test';

/** Dismisses Catawiki's cookie banner if shown. Absence is treated as a no-op. */
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
      // try next strategy
    }
  }
}
