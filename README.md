# Playwright QA Automation Framework

A TypeScript + Playwright Test framework covering UI, API, cross-browser, mobile emulation, performance/network monitoring, and accessibility testing.

- **UI under test:** [saucedemo.com](https://www.saucedemo.com)
- **API under test:** [JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/posts`, `/comments`, `/users`)

## Tech stack

- [Playwright Test](https://playwright.dev/) + TypeScript
- [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright) for accessibility scans
- [`zod`](https://zod.dev/) for API response schema validation
- [Allure](https://allurereport.org/) + Playwright's built-in HTML reporter
- GitHub Actions for CI, Docker for containerized runs

## Project structure

```
src/
  config/env.ts        Environment configuration (base URLs, timeouts)
  pages/                Page Object Model classes for every SauceDemo screen
  api/                  JSONPlaceholder API client + zod response schemas
  fixtures/             Custom Playwright fixtures (authenticatedPage, apiClient, logger)
  test-data/            Centralized test data (users, products, checkout, API payloads)
  utils/                Logger, retry helper, network/performance collection helpers
tests/
  ui/auth/              Authentication flow tests
  ui/shopping/          Cart / shopping flow tests
  ui/checkout/          End-to-end checkout tests
  mobile/               Mobile emulation tests (iPhone 14, Pixel 7)
  accessibility/        axe-core accessibility tests
  performance/          Network/performance monitoring tests
  api/                  JSONPlaceholder API tests (CRUD, schema, chained, negative, retry/timeout)
```

## Prerequisites

- Node.js LTS
- (Optional) Docker, for containerized runs
- (Optional) a local JDK, only needed to generate the Allure HTML report locally — CI installs it automatically

## Setup

```bash
npm install
npx playwright install --with-deps
```

The suite runs out of the box with **zero configuration** — all environment variables have sensible defaults (see `src/config/env.ts`). Copy `.env.example` to `.env` only if you want to override something.

| Variable          | Default                                  | Purpose                                   |
|-------------------|--------------------------------------------|--------------------------------------------|
| `BASE_URL`        | `https://www.saucedemo.com`                | UI application under test                  |
| `API_BASE_URL`    | `https://jsonplaceholder.typicode.com`     | API under test                             |
| `API_TIMEOUT_MS`  | `10000`                                    | Per-request timeout for the API client     |
| `SAUCE_PASSWORD`  | `secret_sauce`                             | Shared password for all SauceDemo demo users |

## Running tests

Playwright projects are organized 1:1 with the assignment's parts, each with its own `testDir` (see `playwright.config.ts`) so specs never run under the wrong project:

| Command                | Runs                                              |
|-------------------------|----------------------------------------------------|
| `npm test`              | Everything — all 8 projects                        |
| `npm run test:ui`       | Auth/shopping/checkout across chromium+firefox+webkit |
| `npm run test:chromium` / `test:firefox` / `test:webkit` | UI tests on a single browser |
| `npm run test:mobile`   | Mobile emulation (iPhone 14 + Pixel 7)             |
| `npm run test:api`      | JSONPlaceholder API tests                          |
| `npm run test:a11y`     | Accessibility tests                                |
| `npm run test:perf`     | Performance & network monitoring tests             |
| `npm run test:headed`   | Full suite, headed browser                         |
| `npm run test:debug`    | Full suite, Playwright inspector                   |

Run a single spec: `npx playwright test tests/ui/auth/login.spec.ts`

## Reports & debugging

- **HTML report:** `npm run report` (opens the last run's Playwright HTML report — includes failure screenshots, videos, and trace links). This is a static site that fetches its data via AJAX, so opening its `index.html` directly (`file://...`) fails with CORS errors — `show-report` serves it locally instead.
- **Trace viewer:** `npx playwright show-trace <path-to-trace.zip>` (traces are captured on first retry, and always in CI)
- **Allure report:** requires a local JDK.
  ```bash
  npm run allure:generate   # builds allure-report/index.html from allure-results/
  npm run allure:open       # optional — serves it locally
  ```
  `allure:generate` runs with `--single-file`, so `allure-report/index.html` is one self-contained file with all data inlined — it can be opened directly by double-clicking, emailing, or dragging into any browser, no server or `allure:open` step required.

### Viewing a report downloaded from a CI run

After downloading and unzipping a `combined-*` artifact from the Actions run summary (see below):

- `combined-allure-html-report` — just open `index.html` directly, it's fully self-contained.
- `combined-playwright-html-report` — needs to be served, since Playwright's HTML report isn't single-file: `npx playwright show-report <path-to-unzipped-folder>`.

## CI/CD

`.github/workflows/playwright.yml` runs on every push/PR to `main`, `master`, and `stage`:

1. A matrix job runs each of the 8 Playwright projects in parallel, uploading its raw blob report + Allure results as `raw-blob-report-<project>` / `raw-allure-results-<project>` artifacts (per-project, not directly browsable).
2. A `merge-reports` job downloads all of those shards and merges them into two final artifacts covering the whole run: `combined-playwright-html-report` (via `playwright merge-reports`) and `combined-allure-html-report` (Java installed via `actions/setup-java`, then `npm run allure:generate`) — download either from the Actions run summary page and view it with the commands above.

## Docker

```bash
docker build -t playwright-qa .
docker run --rm playwright-qa
```

The image is pinned to `mcr.microsoft.com/playwright:v1.61.1-jammy` to match the installed `@playwright/test` version — bump both together if you upgrade Playwright.

## Framework design notes

- **Page Object Model** — every SauceDemo screen has a dedicated page object under `src/pages`, all extending `BasePage`. Specs never contain raw locators.
- **Fixtures** — `src/fixtures/test-fixtures.ts` extends Playwright's `test` with `authenticatedPage` (pre-logged-in session), `apiClient` (pre-configured JSONPlaceholder client), and `logger`.
- **Centralized test data** — credentials, product names, checkout data, and API payloads all live under `src/test-data`, never hardcoded in spec files.
- **Retry mechanism** — Playwright's built-in `retries` (2× on CI) plus a custom `withRetry` utility (`src/utils/retry.ts`) demonstrated against a deterministically-mocked flaky endpoint in `tests/api/retry-timeout.spec.ts`.
- **Session persistence** is verified directly in `login.spec.ts`: a reload keeps the session, while a brand-new browser context with no stored state is redirected away from a protected page.

## Known limitations / documented quirks

- **ReqRes was initially planned as the API target but was dropped**: its v2 free tier now requires a real registered API key (the previously-documented `reqres-free-v1` placeholder key returns `401 missing_api_key`/invalid-key errors), which would make the suite fail out-of-the-box for anyone without an account. JSONPlaceholder needs no key and is fully public, so it's used instead.
- **JSONPlaceholder's fake backend does not persist writes.** A post created via `POST /posts` cannot later be fetched via `GET /posts/:id` — this is why the chained-API test chains `create → PATCH/DELETE` (which return 200 for any id) rather than `create → GET`.
- **JSONPlaceholder doesn't validate payloads at all** — every endpoint accepts arbitrary bodies. Negative tests therefore target genuinely-reliable failure modes instead (404s on nonexistent resources) rather than payload validation, since there is no real validation to exercise.
- **SauceDemo special users** (`locked_out_user`, `problem_user`, `error_user`, `performance_glitch_user`, `visual_user`) are used only in the specific negative-scenario tests that need their deliberately broken behavior — never as the default account for happy-path or accessibility assertions.
- Accessibility assertions target `serious`/`critical` axe-core violations on WCAG 2 A/AA rules; any confirmed false positive would be excluded by rule ID with an inline comment explaining why, rather than a blanket `disableRules`.
