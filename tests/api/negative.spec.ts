import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Negative API Testing', () => {
  test('GET /posts/:id returns 404 for a non-existent post', async ({ apiClient }) => {
    const response = await apiClient.getPost(99_999);

    expect(response.status()).toBe(404);
  });

  test('GET /posts/:id returns 404 for id 0 (out of the valid 1-100 range)', async ({ apiClient }) => {
    const response = await apiClient.getPost(0);

    expect(response.status()).toBe(404);
  });

  test('GET /users/:id returns 404 for a non-existent user on the same API', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/users/99999');

    expect(response.status()).toBe(404);
  });

  test('GET a nonexistent top-level resource returns 404', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/not-a-real-resource');

    expect(response.status()).toBe(404);
  });
});
