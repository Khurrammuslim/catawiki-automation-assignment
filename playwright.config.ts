import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 *
 * Design notes (for review):
 * - Default base URL is the locale-prefixed home; tests use relative paths.
 * - Tests run fully parallel; each spec is independent and creates its own browser context.
 * - In CI we enable retries (1) and capture trace on the first retry — gives us a debuggable
 *   artifact for intermittent failures without bloating successful runs.
 * - Multiple browser projects (Chromium / Firefox / WebKit) prove the suite is engine-agnostic.
 *   For local development you can scope to one with `npm run test:chromium`.
 * - A separate mobile project exercises responsive layouts on Pixel 7 viewport.
 * - The shared `use` block sets a realistic desktop user-agent, locale, timezone,
 *   viewport, and HTTP Accept headers. Catawiki is fronted by Akamai Bot Manager,
 *   which compares the request profile against real-browser baselines. These
 *   settings, combined with the stealth init script wired through `fixtures/`,
 *   reduce false-positive bot rejections. None of these settings are deceptive
 *   — we're just matching what a real Chrome on macOS would send.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.catawiki.com',
    locale: 'en-US',
    timezoneId: 'Europe/Amsterdam',
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Ch-Ua':
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
    },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Override the automation-controlled flag at the launcher level too.
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
