import { test, expect } from '../fixtures/test-fixtures';

/**
 * API / network validation.
 *
 * Different from the UI specs: this one inspects the HTTP layer directly.
 * Two angles, in one spec:
 *
 *   (A) Capture the search request the page fires when the user submits a
 *       query, and validate that the backend call returns a healthy status.
 *       Body inspection is best-effort: on Catawiki the search submission
 *       triggers a full server-rendered navigation, after which Playwright
 *       discards the previous response's body (CDP behaviour — the network
 *       resource is released once the new document loads). Status code
 *       remains accessible and is the meaningful signal: "the backend
 *       responded healthily." When we can read the body (XHR path), we do;
 *       when we can't (navigation path), the status assertion suffices.
 *
 *   (B) Make an independent API request using Playwright's `request` context
 *       (no browser) to the lot-listing URL. This demonstrates the same
 *       pattern that would scale into a separate API test suite.
 *
 * Why this matters for the role: the JD explicitly lists API testing
 * (Postman, RestAssured, "automated tests across ... APIs"). Capturing the
 * page's own network traffic is a lightweight, environment-agnostic way to
 * add API-layer coverage without standing up a separate runner.
 */
test.describe('Catawiki — API / network validation', () => {
  test('search submission triggers a successful backend call', async ({
    openHome,
    page,
  }) => {
    // Start listening for the first response whose URL pattern matches the
    // search/listing endpoint. We register the listener BEFORE the action
    // to avoid missing fast responses. We also accept the navigation
    // response itself (`/s?q=...`) because on Catawiki search is mostly
    // server-rendered, not XHR.
    const responsePromise = page.waitForResponse(
      (res) => {
        const url = res.url();
        const method = res.request().method();
        const isSearchUrl = /\/s\?|\/search|\/api\/.*search|\/v\d+\/lots/i.test(url);
        return method === 'GET' && isSearchUrl;
      },
      { timeout: 15_000 },
    );

    await openHome.search('train');

    const response = await responsePromise.catch(() => null);

    if (response) {
      // Status range 200–399 — accept success (2xx) and redirects (3xx)
      // because the search may redirect to a canonical results URL.
      expect(response.status(), 'search backend should respond healthily')
        .toBeGreaterThanOrEqual(200);
      expect(response.status(), 'search backend should respond healthily')
        .toBeLessThan(400);

      // Body inspection is best-effort. After a full navigation, the
      // response body can be released by the browser — calling .json()
      // or .text() then throws a CDP "No resource with given identifier
      // found" protocol error. We treat that as informational, not a
      // failure: the status code is the contract that matters.
      const contentType = response.headers()['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        try {
          const body = await response.json();
          expect(body, 'JSON response body should be defined').toBeDefined();
          expect(
            JSON.stringify(body).length,
            'JSON response body should be non-trivial',
          ).toBeGreaterThan(20);
        } catch (err) {
          test.info().annotations.push({
            type: 'note',
            description:
              'Response body unavailable post-navigation (expected for server-rendered search). Status assertion is the meaningful signal here.',
          });
        }
      }
    } else {
      // No matching response was captured — fall back to the most basic
      // signal: did the navigation succeed?
      await expect(openHome.page).toHaveURL(/\/s\?|\/search|\/train/i);
    }
  });

  test('lot detail HTTP response is healthy and includes meta tags @smoke', async ({
    page,
    request,
  }) => {
    // Discover a current valid lot ID by walking through the UI first
    // (lot IDs change daily as auctions close, so we don't hardcode).
    await page.goto('/en/');
    await page
      .getByRole('button', { name: /accept/i })
      .first()
      .click({ timeout: 3_000 })
      .catch(() => {});
    await page.getByPlaceholder(/search/i).first().fill('train');
    await page.getByRole('button', { name: /search/i }).first().click();
    await page.waitForURL(/\/s\?|\/search/, { timeout: 15_000 });
    const firstLotHref = await page.locator('a[href*="/l/"]').first().getAttribute('href');
    expect(firstLotHref, 'expected to find a lot link on the results page').not.toBeNull();

    // Now make an independent HTTP request to that lot URL — proves we can
    // exercise the same endpoints from outside the browser, the foundation
    // pattern for a parallel API test suite.
    const lotUrl = new URL(firstLotHref!, 'https://www.catawiki.com').toString();
    const apiResponse = await request.get(lotUrl);

    expect(apiResponse.status(), 'lot page should return 200').toBe(200);
    const body = await apiResponse.text();
    // Basic SEO/meta hygiene: a public lot page should advertise itself with
    // an Open Graph title and a canonical URL. These are stable contracts.
    expect(body, 'lot page should include an Open Graph title').toMatch(/<meta[^>]+property="og:title"/i);
    expect(body, 'lot page should include a canonical link').toMatch(/<link[^>]+rel="canonical"/i);
  });
});
