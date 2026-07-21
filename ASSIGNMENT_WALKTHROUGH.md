# QA Automation Engineer Assignment (Playwright) — Implementation Walkthrough

This document follows the exact structure of the original assignment brief. Under each original requirement is a short **What was done / Where / Why** explaining how this repository satisfies it, so a reviewer can trace every line item back to real code, tests, or CI configuration.

---

## Topics Covered

- **UI/Web Automation Testing** → `tests/ui/**` (auth, shopping, checkout) against SauceDemo.
- **API Testing** → `tests/api/**` against JSONPlaceholder.
- **Cross-browser Testing** → `chromium` / `firefox` / `webkit` Playwright projects.
- **Mobile Emulation** → `Mobile Safari - iPhone 14` / `Mobile Chrome - Pixel 7` projects, `tests/mobile/**`.
- **Performance & Network Monitoring** → `tests/performance/**` + `src/utils/network.ts`.
- **Accessibility Testing** → `tests/accessibility/**` + `@axe-core/playwright`.

---

## Technical Requirements

| Requirement | Status | Where |
|---|---|---|
| Playwright | ✅ | `@playwright/test@1.61.1` (`package.json`) |
| TypeScript | ✅ | Entire framework is `.ts`; `tsconfig.json` added (wasn't present in the starter scaffold) |
| Playwright Test Runner | ✅ | `playwright.config.ts` is the sole test runner — no Jest/Mocha/Cypress mixed in |
| Preferred: GitHub Actions | ✅ | `.github/workflows/playwright.yml` |
| Preferred: Allure Reporting | ✅ | `allure-playwright` + `allure-commandline`, single-file HTML output |
| Preferred: Docker Support | ✅ | `Dockerfile` + `.dockerignore` |

---

## Application Under Test

**Chosen: [saucedemo.com](https://www.saucedemo.com)** (of the three offered options: saucedemo.com, automationexercise.com, demoblaze.com).

**Why:** SauceDemo is purpose-built for QA automation practice — it has stable `data-test` attributes on every interactive element, documented special-purpose accounts (`locked_out_user`, `problem_user`, `error_user`, `performance_glitch_user`, `visual_user`) that exist specifically to drive negative-path tests, and no ads/popups/CAPTCHA to fight. AutomationExercise and DemoBlaze both have less stable markup and more incidental flakiness (ads, native `alert()` dialogs) that would work against the assignment's stated evaluation focus on "maintainability, stability, and architecture quality."

---

## Part 1 — UI / Web Automation Testing

### Authentication Flow — `tests/ui/auth/login.spec.ts`, `src/pages/LoginPage.ts`

| Requirement | What was done | Why this way |
|---|---|---|
| Valid login | Logs in as `standard_user` / `secret_sauce`, asserts redirect to `/inventory.html` | Baseline happy path |
| Invalid login | Two variants: `locked_out_user` (SauceDemo's dedicated locked-account test user) and a valid username with a wrong password | Covers both "account state" and "wrong credential" flavors of invalid login, which are different code paths on most real auth systems |
| Empty credentials validation | Data-driven via `emptyCredentialsCases` in `src/test-data/users.ts` (empty username / empty password / both empty) | One test body, three cases — avoids copy-pasted near-duplicate tests |
| Session persistence validation | Two-part test: (1) log in → `page.reload()` → still authenticated, proving the session survives a reload; (2) open a **brand-new browser context with no stored state** → direct-navigate to `/inventory.html` → assert redirect back to login, proving there's no session without logging in | Chose this over Playwright's `storageState` file mechanism because it directly proves *both halves* of "session persistence" (persists when it should, doesn't leak when it shouldn't) in one self-contained spec, without adding cross-project `storageState` file plumbing that all 8 projects would need to share |

### Product / Shopping Flow — `tests/ui/shopping/cart.spec.ts`, `src/pages/InventoryPage.ts`, `src/pages/CartPage.ts`

| Requirement | What was done | Why |
|---|---|---|
| Add multiple products to cart | Adds 2–3 products (via `getProducts(n)` from centralized test data), asserts the cart badge count | Badge count is the fastest, least brittle signal that "add to cart" worked |
| Remove products | Removes both from the inventory page (badge decrements) and from the cart page itself (item list shrinks) | Exercises both places SauceDemo lets you remove an item — they use different DOM structures |
| Validate cart totals | Sums the individual line-item prices shown on the cart page, then proceeds to checkout step two and asserts the "item total" shown there equals that sum, and that "total" equals "item total + tax" | SauceDemo's cart page itself has no total field — the real total only appears after checkout step one — so a "cart total" test has to walk into checkout to actually validate a total. Also caught a real quirk: SauceDemo will let you check out an **empty** cart (see Negative scenarios below) |

### End-to-End Checkout Flow — `tests/ui/checkout/checkout.spec.ts`, `src/pages/CheckoutStepOnePage.ts` / `CheckoutStepTwoPage.ts` / `CheckoutCompletePage.ts`

| Requirement | What was done | Why |
|---|---|---|
| Mandatory field validation | Data-driven via `invalidCheckoutCases` in `src/test-data/checkout.ts` — missing first name / last name / postal code / all three, each asserting the exact SauceDemo error string | Data-driven rather than four near-identical test functions |
| Negative scenarios | Two: (1) cancelling checkout returns to the inventory page; (2) checking out with an **empty cart** — SauceDemo does *not* block this, it happily proceeds to a $0.00 order | (2) was originally written assuming the checkout button would be hidden/disabled for an empty cart. Running it locally against the real site proved that assumption wrong (SauceDemo has no such guard), so the test was rewritten to **document the actual behavior** instead of asserting a wrong assumption — the kind of discovery a real QA pass is supposed to produce |

---

## Part 2 — API Testing

**Chosen API: [JSONPlaceholder](https://jsonplaceholder.typicode.com)** (of the two offered options: ReqRes API or JSONPlaceholder).

**Why the switch mid-build:** ReqRes was the original choice per the brief. While building the suite, ReqRes's v2 API turned out to require a **real, registered** API key — the previously-documented "free" placeholder key (`reqres-free-v1`) returns `401 missing_api_key` / invalid-key errors (verified directly with `curl`, see commit history). Shipping a test suite that fails out-of-the-box for anyone without a personal ReqRes account would violate the assignment's own "runs out of the box" spirit, so the API layer was swapped to JSONPlaceholder — fully public, zero-config, well documented, and explicitly offered as the alternative in the brief.

### `src/api/PostsClient.ts` (a thin, typed wrapper around Playwright's `APIRequestContext`) + `src/api/schemas.ts` (zod schemas)

| Requirement | What was done | Where |
|---|---|---|
| CRUD Operations | `getPosts`, `getPost`, `createPost` (POST), `updatePost` (PUT), `patchPost` (PATCH), `deletePost` (DELETE) | `tests/api/crud.spec.ts` |
| Response schema validation | `zod` schemas (`PostSchema`, `PostListResponseSchema`, `CreatePostResponseSchema`, `CommentListResponseSchema`) parsed against real responses — a schema mismatch throws a readable diff, not just a generic assertion failure | `tests/api/schema-validation.spec.ts`, `src/api/schemas.ts` |
| Chained API testing | Two chains: (a) `GET /posts` → take the first post's id → `GET /posts/:id` and verify it matches (list→detail); (b) `POST /posts` → take the returned id → `PATCH`/`DELETE` that id (create→mutate) | `tests/api/chained.spec.ts` |
| Negative API testing | 404s for a non-existent post id, id `0` (out of the valid 1–100 range), a non-existent user, and a made-up top-level resource path | `tests/api/negative.spec.ts` |
| Timeout and retry handling | (1) A request with a 1ms client timeout, asserted to reject with a timeout error; (2) `src/utils/retry.ts`'s `withRetry()` helper, unit-tested against a deterministically-flaky in-memory function (fails twice, then succeeds) and against one that always fails (exhausts retries, throws) | `tests/api/retry-timeout.spec.ts` |

**A documented API quirk that shaped the chained/negative tests:** JSONPlaceholder's backend is a fake — `POST`/`PUT`/`PATCH`/`DELETE` always return success codes but never actually persist anything, so a post created via `POST /posts` cannot later be fetched via `GET /posts/:id` (that would 404). The chained test therefore continues with `PATCH`/`DELETE` (which "succeed" for any id, real or not) rather than a `GET` that would flake. This is called out explicitly in code comments and in the README's "Known limitations" section rather than silently worked around, since it's the kind of finding a reviewer would want surfaced, not hidden.

---

## Part 3 — Cross-Browser Testing

`playwright.config.ts` defines three browser projects — `chromium`, `firefox`, `webkit` — each pointed at `testDir: './tests/ui'`, so every auth/shopping/checkout spec automatically runs on all three engines.

| Requirement | What was done | Why |
|---|---|---|
| Run on Chromium/Firefox/WebKit | 19 UI specs × 3 browsers = 57 test executions per full run | Native Playwright multi-project support, not a custom loop |
| Parallel execution | `fullyParallel: true` in the config, plus each project is also a separate parallel job in the CI matrix (see CI/CD section) | Two layers of parallelism: Playwright workers within a job, and GitHub Actions jobs across projects |
| Browser-independent assertions | All locators use SauceDemo's `data-test`/class-based selectors and Playwright's auto-waiting `expect()`, never browser-specific timing hacks or `page.waitForTimeout()` as a correctness mechanism | Keeps the same spec file meaningfully passing/failing the same way on all three engines |

**Design decision — per-project `testDir` instead of one global `testDir` + tag filtering:** each of the 8 Playwright projects (3 browsers, 2 mobile devices, accessibility, performance, api) points at its *own* folder (`./tests/ui`, `./tests/mobile`, etc.) rather than sharing one `testDir` and filtering by `grep`/tag. This makes it structurally impossible for a spec to accidentally run under the wrong project — there's no regex to get subtly wrong, and running `npx playwright test` with no `--project` flag runs the entire suite correctly with zero duplication of, say, API tests across three browsers.

---

## Part 4 — Mobile Emulation Testing

`playwright.config.ts` — two mobile projects, both pointed at `testDir: './tests/mobile'`:

```ts
{ name: 'Mobile Safari - iPhone 14', use: { ...devices['iPhone 14'] } }
{ name: 'Mobile Chrome - Pixel 7',   use: { ...devices['Pixel 7'] } }
```

| Requirement | What was done | Where |
|---|---|---|
| iPhone 14 emulation | Playwright's built-in `devices['iPhone 14']` descriptor (viewport, UA, DPR, touch) | `playwright.config.ts` |
| Pixel 7 emulation | Playwright's built-in `devices['Pixel 7']` descriptor | `playwright.config.ts` |
| Responsive layout validation | Asserts `document.documentElement.scrollWidth` doesn't exceed the viewport width (no horizontal overflow) | `tests/mobile/responsive-navigation.spec.ts` |
| Mobile navigation validation | Opens the burger menu, asserts logout/all-items/reset-state links are present and functional; a separate test performs an actual logout through the burger menu | same file |
| Touch interaction validation | Uses `locator.tap()` (not `.click()`) for "add to cart" and the sort dropdown, which only works meaningfully on a context with `hasTouch: true` — which `devices['iPhone 14']`/`devices['Pixel 7']` set for you | same file |

**Note:** the device descriptors are always spread *first* into each project's `use` block (`{ ...devices['iPhone 14'] }`) so their `isMobile`/`hasTouch` flags aren't accidentally overridden by other config — `tap()` silently no-ops without `hasTouch`.

---

## Part 5 — Performance & Network Monitoring

`src/utils/network.ts` + `tests/performance/network-performance.spec.ts`

| Requirement | What was done | How |
|---|---|---|
| Validate API response times | Times a `PostsClient.getPosts()` call with `Date.now()` deltas, asserts under a 3s budget | `apiClient` fixture + wall-clock timing |
| Capture failed requests | `collectFailedRequests(page)` subscribes to Playwright's `page.on('requestfailed', ...)`; the test deliberately `page.route(...).abort()`s a request to prove the collector actually works (rather than hoping something fails naturally) | `src/utils/network.ts` |
| Monitor console errors | `collectConsoleErrors(page)` subscribes to `page.on('console', ...)` filtering `type() === 'error'` | same file |
| Track page load performance | `getNavigationTiming(page)` reads the browser's own `performance.getEntriesByType('navigation')` entry for TTFB, DOMContentLoaded, and full load timings | same file |
| Network interception and mocking | `page.route()` intercepts a JSONPlaceholder call and `route.fulfill()`s a mocked JSON body; the page's own in-browser `fetch()` (not Playwright's Node-side `page.request`, which bypasses routing entirely) is used to trigger it, with `Access-Control-Allow-Origin: *` added to the mocked response so the browser's own CORS check doesn't block it | `tests/performance/network-performance.spec.ts` |

**A flakiness finding fixed mid-build:** the original "no unexpected console errors" assertion was too strict for a live third-party site — in CI, shared GitHub-hosted-runner IP ranges intermittently get rate-limited/blocked (401) by third-party resources SauceDemo's page pulls in (analytics/fonts), which showed up as `"Failed to load resource: ...401"` console noise unrelated to the app. The assertion now filters out that specific browser-level network-log message class and asserts zero *application*-level console errors — the failed-request scenario is already covered deterministically by the adjacent test, so this one is scoped to catching real app bugs, not third-party flakiness.

---

## Part 6 — Accessibility Testing

`tests/accessibility/a11y.spec.ts`

| Requirement | What was done | How |
|---|---|---|
| Integrate axe-core | `@axe-core/playwright`'s `AxeBuilder`, scanning login/inventory/cart pages against `wcag2a` + `wcag2aa` tags | |
| Validate ARIA roles | Explicit `page.getByRole('textbox' / 'button', { name: ... })` assertions on the login form, which only pass if the accessible name/role computation is correct | |
| Validate alt texts | `InventoryPage.getProductImageAltTexts()` asserts every product image has non-empty `alt` text | |
| Keyboard navigation testing | `LoginPage.loginWithKeyboard()` drives the entire login flow via `.click()` + `Tab` + `Enter` only, no mouse-targeted clicks on the password field or submit button | |
| Accessibility assertions | Every scan asserts zero `serious`/`critical`-impact violations (not just "zero violations of any severity", which would be an unreasonably strict bar for a page you don't control) | |

**A real finding, not a false positive:** the axe scan on the inventory page turned up a genuine, pre-existing defect in SauceDemo itself — the product-sort `<select>` element has no accessible name (no `<label>`, `aria-label`, or `aria-labelledby`). Since this is third-party markup this suite can't fix, that one rule (`select-name`) is excluded **by rule ID, with an inline comment explaining exactly why**, only on the one page where it fires — every other axe rule on that page (and every rule on every other page) still fails the build if it regresses. This was a deliberate choice over either (a) silently lowering the bar for the whole page, or (b) leaving the suite permanently red for a defect outside this codebase's control.

---

## Framework Expectations

| Expectation | What was done | Where |
|---|---|---|
| Page Object Model | One class per SauceDemo screen (`LoginPage`, `InventoryPage`, `CartPage`, `CheckoutStepOnePage`, `CheckoutStepTwoPage`, `CheckoutCompletePage`), all extending a shared `BasePage` | `src/pages/` |
| Reusable utilities | `logger.ts` (scoped logging + `test.step()` wrapper), `retry.ts` (generic retry-with-backoff), `network.ts` (failed-request/console-error/timing collectors) | `src/utils/` |
| Centralized test data | Credentials, product names, checkout field cases, and API payloads all live in one place, never inlined as magic strings in spec files | `src/test-data/` |
| Environment configuration | `src/config/env.ts` reads `process.env` via `dotenv/config` with hardcoded fallback defaults, so the suite runs with **zero setup** — `.env.example` documents every override | `src/config/env.ts`, `.env.example` |
| Parallel execution | `fullyParallel: true` + 8 independent Playwright projects, each also an independent parallel job in CI | `playwright.config.ts`, `.github/workflows/playwright.yml` |
| Retry mechanism | Two layers: Playwright's built-in `retries: process.env.CI ? 2 : 0` for whole-test retries, plus the custom `withRetry()` utility for retrying arbitrary async operations inside a test (demonstrated against a deterministic flaky mock, not real network flakiness, so the test itself isn't flaky) | `playwright.config.ts`, `src/utils/retry.ts` |
| Logging support | `createLogger(scope)` gives timestamped, scoped `info`/`warn`/`error` plus a `step()` helper that wraps `test.step()` so log output shows up as readable steps in both the HTML and Allure reports | `src/utils/logger.ts` |

---

## Reporting & Debugging

`playwright.config.ts` `use` block + `reporter` array:

| Requirement | What was done |
|---|---|
| HTML Reports | Playwright's built-in `html` reporter locally; `blob` reporter in CI (sharded, then merged into one `html` report by the `merge-reports` job) |
| Failure screenshots | `screenshot: 'only-on-failure'` |
| Video recording | `video: 'retain-on-failure'` |
| Trace Viewer | `trace: 'on-first-retry'`, always retried at least once on CI (`retries: 2`), so a trace is captured for every CI failure |
| Preferred: Allure Reporting | `allure-playwright` reporter writes to `allure-results/`; `npm run allure:generate` builds `allure-report/index.html` |

**A deliberate refinement — single-file Allure output:** `allure generate` is run with `--single-file`, so `allure-report/index.html` is one self-contained ~2.7MB file with all report data inlined, verified (via an automated `file://` load with a zero-console-errors check) to render correctly with a plain double-click — no local server, no CORS errors from the browser trying to `fetch()` separate data files. This matters specifically for the CI artifact: a reviewer downloading `combined-allure-html-report` from the Actions run can just open it, no `npx allure open` step required. Playwright's own HTML report has no equivalent single-file mode, so it's still opened via `npx playwright show-report <path>`.

---

## CI/CD Integration

`.github/workflows/playwright.yml` — two jobs:

**Job 1 — `test`** (matrix, `fail-fast: false`, one entry per Playwright project — 8 parallel runners):
1. `actions/checkout@v7`, `actions/setup-node@v6` (Node LTS, npm cache)
2. `npm ci` — install dependencies
3. `npx playwright install --with-deps` — install browsers
4. `npx playwright test --project="<matrix project>"` — run just that project's tests
5. Upload that project's raw artifacts: `raw-blob-report-<project>` and `raw-allure-results-<project>` (per-project, intermediate — not directly browsable)

**Job 2 — `merge-reports`** (`needs: test`, runs once all 8 finish):
1. Downloads all `raw-blob-report-*` shards → `playwright merge-reports --reporter=html` → one combined Playwright HTML report
2. Downloads all `raw-allure-results-*` shards → installs a JDK (`actions/setup-java@v5`, required by the Allure CLI) → `npm run allure:generate` → one combined, single-file Allure report
3. Uploads both as final, run-level artifacts: `combined-playwright-html-report` and `combined-allure-html-report`

| Requirement | Where |
|---|---|
| GitHub Actions or Jenkins pipeline | GitHub Actions chosen — the repo is hosted there, no separate Jenkins infra to stand up |
| Install dependencies | `npm ci` in every job |
| Run tests | Matrixed `npx playwright test --project=...`, one project per parallel runner |
| Generate reports | `playwright merge-reports` + `npm run allure:generate` in the `merge-reports` job |
| Upload artifacts | `actions/upload-artifact@v6`, both raw per-project and final combined artifacts |

**Why a matrix instead of one big job:** it satisfies "parallel execution" at the CI level (not just Playwright's own worker-level parallelism inside one job), keeps any single project's failure from blocking the others (`fail-fast: false`), and keeps individual job logs focused on one project instead of one giant interleaved log.

**Two fixes made after the first real CI runs (kept here for transparency, since a reviewer may see them in the commit history):**
- A console-error assertion (Part 5) was too strict for a live third-party site and got fixed as described above.
- The action versions were bumped to clear "Node.js 20 is deprecated" warnings (`checkout` v4→v7, `setup-node` v4→v6, `upload-artifact` v4→v6, `download-artifact` v4→v7, `setup-java` v4→**v5**). The first attempt used `setup-java@v6`, which doesn't actually exist (confirmed via the GitHub tags API) and broke the job outright with an "unable to resolve action" error — corrected to `v5`, which does exist and still runs on Node 24, so it still clears the original warning.

---

## Deliverables

| Deliverable | Where |
|---|---|
| GitHub Repository | `Montu6734/playwright-qa-assignment`, work done on `stage`, merged to `main` via pull request |
| README documentation | `README.md` — overview, setup, env vars, run commands, report viewing, CI/CD explanation, Docker usage, framework design notes, known limitations |
| Execution instructions | `README.md` "Running tests" + "Setup" sections; also documented in this file's CI/CD section |
| Sample reports/screenshots | Generated fresh by every CI run as the `combined-playwright-html-report` / `combined-allure-html-report` artifacts — not checked into git, since committing generated binary reports would immediately go stale and bloat the repo |
| CI pipeline configuration | `.github/workflows/playwright.yml` |

---

## Evaluation Criteria

| Criterion | How this repo addresses it |
|---|---|
| Automation coding standards | TypeScript throughout, strict `tsconfig.json`, no `any`-typed locators, Page Object Model, no copy-pasted test bodies (data-driven where the assignment's own bullet points imply repetition — empty credentials, mandatory-field validation) |
| Framework scalability | Adding a new UI flow means adding a page object + a spec in `tests/ui/`; adding a new API resource means adding a client method + a spec in `tests/api/`; adding a new device means one line in `playwright.config.ts`'s `projects` array — no changes needed elsewhere |
| API testing depth | Full CRUD, schema validation, two distinct chaining patterns, four negative scenarios, and both timeout and retry handling — not just happy-path GET/POST |
| Cross-browser reliability | 57 UI test executions (19 specs × 3 engines) using only auto-waiting, non-browser-specific assertions |
| Accessibility implementation | Real axe-core integration that found and correctly triaged a genuine third-party defect, plus explicit ARIA/alt-text/keyboard coverage beyond just running the scanner |
| Performance monitoring capability | Response-time budgets, failed-request capture, console-error monitoring (tuned to avoid third-party noise), navigation timing, and genuine request interception/mocking |

---

## Expected Completion Time

Brief estimate: 8–12 hours, "focus on maintainability, stability, and architecture quality." The two mid-build pivots documented above (ReqRes → JSONPlaceholder; loosening the console-error assertion) are exactly the kind of judgment calls that estimate is meant to leave room for — building against the real, live systems surfaced two assumptions from the initial plan that didn't hold up, and both were fixed by adjusting the test to match verified real-world behavior rather than forcing the original assumption to pass.
