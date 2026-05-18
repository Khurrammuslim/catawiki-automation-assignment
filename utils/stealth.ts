import { BrowserContext } from '@playwright/test';

/**
 * Aligns the browser fingerprint with a real Chrome session so Catawiki's
 * Akamai Bot Manager does not reject automation traffic. See README for context.
 */
export async function applyStealth(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' },
      ],
      configurable: true,
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true,
    });

    if (typeof (window as unknown as { chrome?: object }).chrome === 'undefined') {
      Object.defineProperty(window, 'chrome', { value: { runtime: {} }, configurable: true });
    }
  });
}