import { APIResponse, expect } from '@playwright/test';
import { test } from '../fixtures/test-fixtures';

/** Asserts an HTTP status in the 2xx/3xx success range. */
async function expectHealthyStatus(response: APIResponse | { status(): number }): Promise<void> {
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(400);
}

test.describe('Catawiki — API / network validation', () => {
  test('search submission returns a healthy HTTP response from the results endpoint', async ({
    openHome,
    searchResultsPage,
  }) => {
    // Whether the search is an XHR or a full navigation, there will always be
    // a network response on a /s or /search URL. Asserting on that response's
    // status is the HTTP-layer contract — independent of whether the page is
    // server-rendered or client-rendered.
    const responsePromise = openHome.page.waitForResponse(
      (res) => /\/s\?|\/search/i.test(res.url()),
      { timeout: 15_000 },
    );

    await openHome.search('train');

    const response = await responsePromise;
    await expectHealthyStatus(response);
    await searchResultsPage.waitUntilLoaded();
  });

  test('lot detail HTTP response is healthy and serves SEO metadata @smoke', async ({
    openHome,
    searchResultsPage,
    request,
  }) => {
    await openHome.search('train');
    await searchResultsPage.waitUntilLoaded();
    const firstLotHref = await searchResultsPage.getFirstLotHref();

    const lotUrl = new URL(firstLotHref, 'https://www.catawiki.com').toString();
    const apiResponse = await request.get(lotUrl);

    expect(apiResponse.status()).toBe(200);
    const body = await apiResponse.text();
    expect(body).toMatch(/<meta[^>]+property="og:title"/i);
    expect(body).toMatch(/<link[^>]+rel="canonical"/i);
  });
});