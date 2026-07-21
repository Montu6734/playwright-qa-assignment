import type { Page, Request } from '@playwright/test';

export interface NavigationTiming {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
}

/** Starts collecting failed requests; returns a getter for the accumulated list. */
export function collectFailedRequests(page: Page): () => Request[] {
  const failed: Request[] = [];
  page.on('requestfailed', (request) => failed.push(request));
  return () => failed;
}

/** Starts collecting `console.error` messages; returns a getter for the accumulated list. */
export function collectConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  return () => errors;
}

export async function getNavigationTiming(page: Page): Promise<NavigationTiming> {
  return page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return {
      ttfbMs: entry.responseStart - entry.requestStart,
      domContentLoadedMs: entry.domContentLoadedEventEnd - entry.startTime,
      loadEventMs: entry.loadEventEnd - entry.startTime,
    };
  });
}
