import { BrowserContext } from '@playwright/test';

/**
 * Make the browser context look less like an automation tool to bot-detection
 * systems (Akamai, Cloudflare, DataDome, PerimeterX). Catawiki sits behind
 * Akamai Bot Manager, which checks several signals beyond user-agent strings.
 *
 * These tweaks are honest and minimal — we're not pretending to be a different
 * browser, we're just removing the obvious "Playwright was here" tells:
 *
 *   - `navigator.webdriver` defaults to `true` under Playwright; real Chrome
 *     leaves it `false`/`undefined`.
 *   - `navigator.plugins` is empty under automation; real Chrome has a
 *     non-empty PluginArray.
 *   - `navigator.languages` is sometimes empty.
 *   - `window.chrome` is missing in headless mode.
 *
 * If you ever face stricter detection, the right answer is to coordinate with
 * the dev team to whitelist the test runner / use a staging environment, not
 * to escalate to heavier evasion (which becomes a maintenance burden).
 */
export async function applyStealth(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    // 1. Hide the automation flag.
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true,
    });

    // 2. Populate navigator.plugins with a plausible non-empty PluginArray
    //    so feature-detection scripts don't see an obviously empty list.
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' },
      ],
      configurable: true,
    });

    // 3. Ensure languages is non-empty and matches the locale.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true,
    });

    // 4. Provide a window.chrome stub when running headless.
    if (typeof (window as unknown as { chrome?: object }).chrome === 'undefined') {
      Object.defineProperty(window, 'chrome', {
        value: { runtime: {} },
        configurable: true,
      });
    }
  });
}
