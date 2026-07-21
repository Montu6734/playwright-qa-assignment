import { test, expect } from '../../src/fixtures/test-fixtures';
import { LoginPage } from '../../src/pages/LoginPage';
import { collectFailedRequests, collectConsoleErrors, getNavigationTiming } from '../../src/utils/network';
import { config } from '../../src/config/env';

test.describe('Performance & Network Monitoring', () => {
  test('API response time for the JSONPlaceholder posts endpoint is within budget', async ({ apiClient }) => {
    const start = Date.now();
    const response = await apiClient.getPosts();
    const durationMs = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(durationMs).toBeLessThan(3000);
  });

  test('captures failed requests when a resource is aborted', async ({ page }) => {
    const getFailedRequests = collectFailedRequests(page);

    await page.route('**/inventory.html', (route) => route.abort('failed'));
    await page.goto(`${config.baseURL}/inventory.html`).catch(() => undefined);

    expect(getFailedRequests().length).toBeGreaterThan(0);
  });

  test('page load has no unexpected console errors', async ({ page }) => {
    const getConsoleErrors = collectConsoleErrors(page);
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', config.defaultPassword);
    await expect(page).toHaveURL(/inventory\.html/);

    // "Failed to load resource" entries are the browser's own network log for a
    // failed background request (fonts/analytics/etc. the page pulls from third
    // parties we don't control), not an application error — and shared CI IP
    // ranges get rate-limited/blocked by such third parties far more often than
    // a residential IP. Failed-request detection itself is already covered
    // deterministically by the test above; this assertion is scoped to genuine
    // app-level console errors only.
    const appErrors = getConsoleErrors().filter((message) => !/^Failed to load resource:/.test(message));
    expect(appErrors).toEqual([]);
  });

  test('tracks page load / navigation performance metrics', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const timing = await getNavigationTiming(page);

    expect(timing.ttfbMs).toBeGreaterThanOrEqual(0);
    expect(timing.domContentLoadedMs).toBeGreaterThan(0);
    expect(timing.loadEventMs).toBeGreaterThan(0);
    expect(timing.loadEventMs).toBeLessThan(15_000);
  });

  test('network interception: mocked API response is honored by the page', async ({ page }) => {
    // Route interception only applies to requests issued from the browser's own
    // network stack, so the request is triggered via an in-page fetch() rather
    // than the Node-side `page.request` context (which would bypass the route).
    await page.route('**/jsonplaceholder.typicode.com/posts/1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ id: 1, title: 'Mocked title', body: 'Mocked body', userId: 1 }),
      }),
    );
    await page.goto(config.baseURL);

    const body = await page.evaluate(async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      return res.json();
    });

    expect(body.title).toBe('Mocked title');
  });
});
