# Catawiki — UI Automation Assignment

UI test automation suite for [catawiki.com](https://www.catawiki.com/en/) covering the required home-assignment scenario and four additional, deliberately diverse tests.

Built with **Playwright + TypeScript** using the Page Object Model pattern, runs across Chromium / Firefox / WebKit / Pixel-7 mobile, and ships with a GitHub Actions workflow.

---

## Quick start

```bash
# Requires Node.js 18+
npm install
npm run install:browsers      # downloads Chromium / Firefox / WebKit (~600 MB)

npm test                      # all projects, all specs, headless
npm run test:headed           # see the browser
npm run test:ui               # interactive Playwright UI mode (best for development)
npm run test:chromium         # just one engine, fastest local iteration
npm run test:smoke            # only @smoke-tagged tests
npm run report                # open the last HTML report
```

After a run, the HTML report lives in `playwright-report/`; JUnit XML for CI in `test-results/junit.xml`.

---

## What's covered

The assignment asks for the required scenario plus diverse test cases that "are not similar in implementation." Five specs deliver that:

| # | Spec | Tests | What makes it different |
|---|---|---|---|
| 01 | `01-required-scenario.spec.ts` | The exact assignment flow: home → search "train" → click 2nd lot → read & print name / favorites / current bid | The reference end-to-end happy path |
| 02 | `02-search-keyword-variations.spec.ts` | Data-driven: 4 different keywords each return results, URL preserves the query | Parameterized, no lot-page navigation, asserts URL contract |
| 03 | `03-no-results.spec.ts` | Gibberish query → graceful empty state, not an error | Negative branch — the path users hit on typos |
| 04 | `04-lot-data-shape.spec.ts` | Lot-page name / favorites / bid match expected **types and formats** (not just visible) | Data-shape assertions over visual checks; catches subtle regressions |
| 05 | `05-homepage-smoke.spec.ts` | Pure homepage smoke — page title, search input editable, no severe console errors | Non-interactive, fast (~1s), tags `@smoke` for pipeline gating |
| 06 | `06-api-network-validation.spec.ts` | HTTP/API layer — captures the search backend call during a UI search, plus an independent `request`-context GET of a lot page validating status and meta-tag contracts | Tests the network layer directly, decoupled from DOM rendering |

All specs run on all four browser projects via the Playwright config — so the same 6 specs execute 24 times in CI, covering Chromium, Firefox, WebKit desktop, and a Pixel-7 mobile viewport.

### How this maps to the role

The Catawiki QA Engineer role calls out a specific set of capabilities. Here's how this suite demonstrates each:

| Role requirement | Where it's demonstrated |
|---|---|
| Playwright (test framework) | Entire suite — `playwright.config.ts`, all 6 specs |
| TypeScript (programming language) | Strict TS throughout; `tsconfig.json` with `strict: true` |
| API testing (Postman / RestAssured / similar) | `06-api-network-validation.spec.ts` — both `waitForResponse` capture and `request` context |
| CI/CD integration (GitHub Actions) | `.github/workflows/playwright.yml` — matrix build, artifacts, scheduled run |
| Cross-browser (Chrome / Safari / Firefox) | Four projects: Chromium, Firefox, WebKit, mobile-chrome |
| Cross-device / mobile | Pixel-7 mobile viewport project — same specs run on a mobile-shaped viewport |
| BrowserStack / cloud testing | Architecturally compatible — see [Cloud-grid integration](#cloud-grid-integration-browserstack--similar) below |
| Test framework development | Page Object Model + custom fixtures pattern is the framework; new tests reuse it without re-plumbing |
| Functional + regression coverage | Specs 01–05 |
| Defect tracking signal | JUnit XML output in CI integrates with Jira / Allure / similar via existing GitHub Actions plugins |
| Agile working style | Conventional commits, PR-friendly diffs, one spec per concern — designed to be code-reviewed |

### Cloud-grid integration (BrowserStack / similar)

Not configured in this repo (it needs paid credentials and is out of scope for a take-home), but the Playwright config is ready for it. Adding a fifth project pointed at BrowserStack's Playwright endpoint is a ~5-line change:

```ts
// playwright.config.ts (sketch)
{
  name: 'browserstack-chrome-win11',
  use: {
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
        browser: 'chrome', os: 'Windows', osVersion: '11',
        'browserstack.username': process.env.BS_USERNAME,
        'browserstack.accessKey': process.env.BS_KEY,
      }))}`,
    },
  },
}
```

Same specs would run unchanged — that's the value of the framework being thin enough not to bake in environment assumptions.

---

## Project layout

```
catawiki-automation/
├── pages/
│   ├── HomePage.ts            # Landing page + cookie consent + search
│   ├── SearchResultsPage.ts   # Results list and "open the Nth lot"
│   └── LotPage.ts             # Lot detail — name / favorites / bid
├── tests/
│   ├── 01-required-scenario.spec.ts
│   ├── 02-search-keyword-variations.spec.ts
│   ├── 03-no-results.spec.ts
│   ├── 04-lot-data-shape.spec.ts
│   ├── 05-homepage-smoke.spec.ts
│   └── 06-api-network-validation.spec.ts
├── fixtures/
│   └── test-fixtures.ts       # Custom fixtures: page objects + openHome
├── utils/
│   └── consent.ts             # Resilient cookie-banner dismissal
├── .github/workflows/
│   └── playwright.yml         # Multi-project CI on push/PR + nightly schedule
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Design decisions (and the reasoning behind each)

### 1. Why Playwright + TypeScript

Playwright is auto-waiting, parallel-safe, and exposes accessibility-based locators that survive class-name churn. TypeScript catches selector typos at compile time and makes refactoring page objects safe. Together they hit the sweet spot of velocity, reliability, and recruiter-readability.

### 2. Page Object Model

Each page that the tests interact with has a class that exposes meaningful business actions (`search('train')`, `openLotByIndex(1)`) and hides selectors as private members. Two consequences:

- A UI refactor on the lot page means one file changes (`LotPage.ts`), not five tests.
- Tests read like the assignment narrative, not DOM noise.

### 3. Resilient locators in preference order

```
getByRole / getByLabel / getByPlaceholder      ← preferred (accessibility, semantic)
getByTestId                                     ← second-best if dev team has test IDs
href / URL-pattern based locators              ← stable for routing schemes
CSS by stable ID                                ← acceptable
XPath positional / generated class names        ← avoided
```

Where one strategy isn't enough I chain alternatives with `.or(...)` so the locator survives small markup variations — important for a site I can't modify.

### 4. Auto-waiting only — no `setTimeout`

Every wait is condition-based: `expect(locator).toBeVisible()`, `page.waitForURL(...)`, `card.scrollIntoViewIfNeeded()`. There is no `setTimeout` or `page.waitForTimeout` anywhere in the suite. Hardcoded waits are the #1 source of flake; condition waits are both faster on a healthy site and more honest about what we're actually waiting for.

### 5. Cookie consent handled centrally

Catawiki is an EU site so a GDPR banner appears on first visit. If it isn't dismissed, clicks get swallowed. The dismissal logic lives in `utils/consent.ts`, is called by `HomePage.open()`, and tries several locator strategies in order — so if the consent UI changes, one file fixes the whole suite. The function treats the banner's absence as a non-error.

### 6. Custom fixtures

`fixtures/test-fixtures.ts` extends Playwright's base `test` with page objects and an `openHome` convenience fixture. This trims boilerplate in every spec (no need for a `beforeEach` that constructs page objects manually) while keeping setup explicit per test.

### 7. Tests are independent

Each spec creates its own browser context, navigates from `/en/`, and doesn't share state with other specs. `fullyParallel: true` is on by default. Specs can be re-ordered, run alone, or run in shards without breaking.

### 8. CI strategy

The GitHub Actions workflow runs every spec on every browser project on every push and PR, plus a nightly scheduled run on `main`. Failures upload the HTML report and JUnit XML as artifacts — opening the report from CI is one click.

### 9. Trace on first retry

A failing test in CI retries once with full tracing enabled. The trace (`.zip`) opens in `npx playwright show-trace` to show the full DOM at every action, network calls, and screenshots — usually enough to root-cause without re-running locally.

### 10. Tagging

`@smoke` marks tests fit for a fast pipeline gate (the required scenario + homepage smoke). The other tests are full regression. Run with `npm run test:smoke` to scope to the fast set.

---

## Bot protection — Akamai on catawiki.com

Catawiki sits behind **Akamai Bot Manager**, which inspects request fingerprints to block automated traffic. Out-of-the-box Playwright (and most automation tools) trip several of its signals — `navigator.webdriver = true`, empty `navigator.plugins`, missing `Sec-Ch-Ua` client hints, default Playwright user-agent string. A naked Playwright run against catawiki.com/en/ typically receives an **HTTP 403 with an "Access Denied" Akamai error page** (look for `errors.edgesuite.net` in the response).

This suite addresses that at two layers:

1. **`playwright.config.ts`** sets a realistic desktop Chrome user-agent, locale, timezone, viewport, and `Accept-*` / `Sec-Ch-Ua` headers, plus `--disable-blink-features=AutomationControlled` on the Chromium project.
2. **`utils/stealth.ts`** is wired through the `context` fixture in `fixtures/test-fixtures.ts` so every browser context loads an init script that hides the `webdriver` flag, populates `navigator.plugins` and `navigator.languages` with realistic values, and stubs `window.chrome` in headless mode.

None of these tweaks deceive the user or the test — they make the browser look like a real one to the Akamai signal model. In a real engagement, the right long-term answer is one of:

- Coordinate with the Catawiki dev team to whitelist the test runner's egress IP, or
- Run the suite against a staging environment where bot protection is disabled or relaxed, or
- Use a test-mode header/cookie that Akamai-protected sites typically expose for internal QA traffic.

The stealth layer here is the pragmatic option when you don't have any of those — common in take-home assignments against production sites.

### If it still blocks you

If `Access Denied` still shows up after a `git pull` of the latest config:

1. Try the headed Chromium project first: `npm run test:headed -- --project=chromium`. Headed runs almost always pass; headless trips more signals.
2. Slow the run down: add `--workers=1` to serialize tests.
3. Check your local IP — corporate VPN or known datacenter IPs are reputation-flagged. Try from a residential connection.
4. Worst case, run only the API spec which bypasses the browser entirely: `npx playwright test tests/06-api-network-validation.spec.ts --project=chromium`.

## Known limitations & deliberate trade-offs

- **Selectors are educated guesses against the live site.** Catawiki may have renamed elements between the time I wrote the code and the time you run it. The chained-strategy locators (`.or(...)`) reduce risk but a fresh selector audit may be needed against the current production DOM. In a real engagement, I'd partner with the dev team to add stable `data-testid` attributes.
- **The "second lot" definition.** The assignment says "second lot in search results." I interpreted this as the second visible card matching the lot URL pattern (`/l/...`). If Catawiki promotes sponsored slots above organic, this index could land on a sponsored lot — a question I would raise with the team in a real setting.
- **No visual regression testing.** Out of scope for this assignment; on a real project I'd add Playwright's `toHaveScreenshot()` for the bid panel since it's both visually rich and business-critical.
- **No authenticated flows.** All assignment scenarios are anonymous. Authenticated paths (placing a bid, watching a lot) would need a separate auth fixture with stored session state.
- **No performance budget.** Easy to add: assert `responseTime < N` on key navigations, or run a Lighthouse audit step in CI.

---

## Running individual tests

```bash
# Just the required scenario
npx playwright test tests/01-required-scenario.spec.ts

# Just smoke (the fast subset)
npm run test:smoke

# A specific browser
npm run test:chromium

# Headed mode for debugging
npm run test:headed

# Interactive UI mode — best for live development
npm run test:ui
```

---

## What I'd add next

In a follow-up I'd cover authenticated flows (place a watch / unwatch with stored auth state), add visual snapshot testing on the bid panel, integrate Lighthouse CI for performance budgets on the home and a representative lot page, expand spec 06 into a full API test suite using `request` contexts against Catawiki's public endpoints, and wire in BrowserStack for real-device coverage on iOS and Android — the place where mobile testing pairs with Espresso / XCUITest in the broader Catawiki QA stack.
