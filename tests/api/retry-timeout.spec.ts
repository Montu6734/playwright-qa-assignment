import { test, expect } from '@playwright/test';
import { withRetry } from '../../src/utils/retry';

test.describe('Timeout and Retry Handling', () => {
  test('a request exceeding its timeout budget rejects with a timeout error', async ({ playwright }) => {
    const context = await playwright.request.newContext({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 1, // 1ms — guaranteed to trip before any real network round-trip completes
    });

    await expect(context.get('/posts/1')).rejects.toThrow(/timeout/i);

    await context.dispose();
  });

  test('withRetry retries a flaky operation until it succeeds', async () => {
    let attempts = 0;
    const flakyOperation = async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('simulated transient failure');
      }
      return 'success';
    };

    const result = await withRetry(flakyOperation, { retries: 3, delayMs: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('withRetry gives up and throws after exhausting retries', async () => {
    let attempts = 0;
    const alwaysFails = async () => {
      attempts += 1;
      throw new Error('always fails');
    };

    await expect(withRetry(alwaysFails, { retries: 2, delayMs: 5 })).rejects.toThrow('always fails');
    expect(attempts).toBe(3); // initial attempt + 2 retries
  });

  test('withRetry honors shouldRetry and stops immediately for non-retryable errors', async () => {
    let attempts = 0;
    const nonRetryable = async () => {
      attempts += 1;
      throw new Error('non-retryable');
    };

    await expect(
      withRetry(nonRetryable, { retries: 3, delayMs: 5, shouldRetry: () => false }),
    ).rejects.toThrow('non-retryable');
    expect(attempts).toBe(1);
  });
});
