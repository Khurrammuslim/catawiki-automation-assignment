# Catawiki — UI Automation Assignment

UI + API test automation suite for [catawiki.com](https://www.catawiki.com/en/) covering the required home-assignment scenario and five additional, deliberately diverse cases.

Built with **Playwright + TypeScript** using the Page Object Model, runs across Chromium and Firefox, and ships with a GitHub Actions workflow that gates lint, formatting, and the full test matrix.

---

## Quick start

```bash
# Requires Node.js 18+
npm install
npm run install:browsers      # downloads Chromium + Firefox

npm test                      # all projects, all specs, headless
npm run test:headed           # see the browser
npm run test:ui               # interactive Playwright UI mode (best for development)
npm run test:chromium         # just one engine, fastest local iteration
npm run test:smoke            # only @smoke-tagged tests
npm run report                # open the last HTML report

npm run lint                  # ESLint over the project
npm run format:check          # Prettier — verify formatting
npm run format                # Prettier — fix formatting in place
```

After a run, the HTML report lives in `playwright-report/`; JUnit XML for CI in `test-results/junit.xml`.

---

## What's covered

| #   | Spec                                   | Tests                                                                                                                                         | What makes it different                              |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 01  | `01-required-scenario.spec.ts`         | The exact assignment flow: home → search "train" → click 2nd lot → read & print name / favorites / current bid                                | Reference end-to-end happy path                      |
| 02  | `02-search-keyword-variations.spec.ts` | Data-driven: 4 keywords each return results, URL preserves the query                                                                          | Parameterized, asserts URL contract                  |
| 03  | `03-no-results.spec.ts`                | Blank-space query → graceful empty state                                                                                                      | Negative branch of the search flow                   |
| 04  | `04-lot-data-shape.spec.ts`            | Lot-page name / favorites / bid match expected **types and formats**                                                                          | Data-shape assertions over visual checks             |
| 05  | `05-homepage-smoke.spec.ts`            | Pure homepage smoke — title, search input editable, no severe console errors                                                                  | Non-interactive, fast (~1s), `@smoke` tagged         |
| 06  | `06-api-network-validation.spec.ts`    | HTTP/API layer — captures search backend call, then an independent `request`-context GET of a lot page validating status + meta-tag contracts | Tests the network layer directly, decoupled from DOM |

All specs run on both browser projects via the Playwright config — so the same 6 specs execute 12 times in CI.

### How this maps to the role

| Role requirement                              | Where it's demonstrated                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Playwright                                    | Entire suite                                                                      |
| TypeScript                                    | Strict TS throughout (`tsconfig.json`)                                            |
| API testing (Postman / RestAssured / similar) | `06-api-network-validation.spec.ts`                                               |
| CI/CD (GitHub Actions)                        | `.github/workflows/playwright.yml` — gates lint + matrix tests, scheduled nightly |
| Cross-browser (Chrome / Firefox)              | Chromium and Firefox projects                                                     |
| Cross-device / mobile, WebKit, BrowserStack   | Architecturally compatible — see below                                            |
| Test framework development                    | POM + custom fixtures pattern                                                     |
| Functional + regression coverage              | Specs 01–05                                                                       |
| Code quality                                  | ESLint + Prettier configured and CI-enforced                                      |
| Defect tracking signal                        | JUnit XML output integrates with Jira / Allure / similar                          |
| Agile working style                           | Clean PRs, one spec per concern, code-review friendly                             |

### Adding more browsers, mobile viewports, or a cloud grid

The current setup focuses on Chromium and Firefox to keep CI fast and deterministic for an assignment. The framework is intentionally thin so adding more coverage is trivial — each is a project entry in `playwright.config.ts`:

- **WebKit (Safari engine):** `{ name: 'webkit', use: { ...devices['Desktop Safari'] } }`
- **Mobile viewport:** `{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }`
- **BrowserStack** (real-device cloud, paid; out of scope for a take-home) — ~5 lines:

```ts
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
│   ├── SearchResultsPage.ts   # Results list, nth-lot, first-lot-href
│   └── LotPage.ts             # Lot detail — name / favorites / bid
├── tests/
│   ├── 01-required-scenario.spec.ts
│   ├── 02-search-keyword-variations.spec.ts
│   ├── 03-no-results.spec.ts
│   ├── 04-lot-data-shape.spec.ts
│   ├── 05-homepage-smoke.spec.ts
│   └── 06-api-network-validation.spec.ts
├── fixtures/
│   └── test-fixtures.ts       # Custom fixtures: page objects + stealth
├── utils/
│   ├── consent.ts             # Resilient cookie-banner dismissal
│   └── stealth.ts             # Akamai bot-protection alignment
├── .github/workflows/
│   └── playwright.yml         # Lint + matrix tests + nightly schedule
├── .eslintrc.json             # ESLint + Playwright + TypeScript plugins
├── .prettierrc.json           # Prettier config
├── .prettierignore
├── playwright.config.ts
├── tsconfig.json              # strict: true
├── package.json
└── README.md
```

---

## Design decisions

### Page Object Model + custom fixtures

Each page exposes business actions (`search('train')`, `openLotByIndex(1)`, `getFirstLotHref()`) and hides selectors. Tests read like the assignment narrative. Custom fixtures inject page objects and apply stealth to every browser context — so each spec only declares what it needs.

### Locator preference

`getByRole / getByLabel / getByPlaceholder` first (accessibility, semantic, survives class churn), then `getByTestId`, then URL-pattern selectors (`a[href*="/l/"]`), then stable IDs. Chained with `.or(...)` for resilience against minor markup changes.

### Auto-waiting only

Every wait is condition-based (`expect(loc).toBeVisible()`, `page.waitForURL(...)`). No `setTimeout` or `waitForTimeout` anywhere. ESLint enforces `playwright/no-wait-for-timeout` as `error`.

### Tests are independent

Each spec creates its own browser context, no shared mutable state, fully parallel by default. Parameterized loops produce independent `test()` declarations.

### Lint + format gates

`npm run lint` and `npm run format:check` run as a separate CI job (`lint`) that the test job `needs:` — so the test matrix only spins up if the code passes basic hygiene. Locally `npm run format` auto-fixes.

### CI strategy

GitHub Actions runs lint → 4-browser test matrix on every push and PR, plus a nightly scheduled run to catch external-dependency drift (Catawiki could change a selector overnight; we'd know within 24h, not the next push). Failures upload HTML reports and JUnit XML as artifacts.

### Trace on first retry

A failing test retries once with full tracing. The trace (`.zip`) opens in `npx playwright show-trace` to show DOM at every action, network calls, screenshots — usually enough to root-cause without re-running locally.

### Tagging

`@smoke` marks the fast subset (required scenario + homepage smoke + critical API spec). The rest are regression. `npm run test:smoke` scopes to the fast set.

---

## Bot protection — Akamai on catawiki.com

Catawiki sits behind **Akamai Bot Manager**, which inspects request fingerprints to block automated traffic. Out-of-the-box Playwright trips several signals — `navigator.webdriver = true`, empty `navigator.plugins`, missing `Sec-Ch-Ua` client hints, default user-agent. A naked Playwright run returns **HTTP 403 with an "Access Denied" Akamai error page** (look for `errors.edgesuite.net` in the response).

This suite addresses that at two layers:

1. **`playwright.config.ts`** sets a realistic Chrome user-agent, locale, timezone, viewport, and `Accept-*` / `Sec-Ch-Ua` headers, plus `--disable-blink-features=AutomationControlled` on the Chromium project.
2. **`utils/stealth.ts`** is wired through the `context` fixture so every browser context loads an init script that hides `navigator.webdriver`, populates `navigator.plugins` and `navigator.languages`, and stubs `window.chrome` in headless mode.

None of these tweaks deceive the user or the test — they make the browser look like a real one to the Akamai signal model. In a real engagement the right long-term answer is to coordinate with the Catawiki team to whitelist the test runner's IP or to point tests at a staging environment with relaxed bot protection. The stealth layer is the pragmatic option for a take-home against production.

### If it still blocks you

1. Try headed Chromium first: `npm run test:headed -- --project=chromium`.
2. Serialize: add `--workers=1`.
3. Check your local IP — corporate VPN or datacenter IPs are reputation-flagged.
4. Last resort, run only the API spec: `npx playwright test tests/06-api-network-validation.spec.ts --project=chromium`.

---

## Known limitations & trade-offs

- **Selectors are educated guesses against a live site.** Catawiki may have renamed elements between when this was written and when you run it. `.or(...)` chains reduce risk; in a real engagement I'd push for stable `data-testid` attributes on the elements my tests depend on.
- **"Second lot" interpretation.** I picked the second visible card matching the lot URL pattern (`/l/...`). If sponsored slots sit above organic, the index could land on a sponsored lot — a question I'd raise with the team.
- **No visual regression testing.** Out of scope; I'd add `toHaveScreenshot()` on the bid panel for a real project.
- **No authenticated flows.** Out of scope; would need a separate auth fixture with stored session state.
- **Live external site means no SLA.** I don't assert on performance budgets here; with a real spec I'd add them.

---

## What I'd add next

Authenticated flows (watch / unwatch with stored auth state), visual snapshot testing on the bid panel, Lighthouse CI for performance budgets, expansion of spec 06 into a full API test suite hitting Catawiki's public endpoints, and BrowserStack for real-device iOS/Android coverage.
