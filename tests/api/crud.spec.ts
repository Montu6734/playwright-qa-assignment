import { test, expect } from '../../src/fixtures/test-fixtures';
import { newPostPayload, updatePostPayload } from '../../src/test-data/api-payloads';

test.describe('API CRUD Operations', () => {
  test('GET /posts returns a list of posts', async ({ apiClient }) => {
    const response = await apiClient.getPosts();
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('GET /posts/:id returns a single existing post', async ({ apiClient }) => {
    const response = await apiClient.getPost(1);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.id).toBe(1);
  });

  test('POST /posts creates a new post', async ({ apiClient }) => {
    const response = await apiClient.createPost(newPostPayload);
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.title).toBe(newPostPayload.title);
    expect(body.id).toBeTruthy();
  });

  test('PUT /posts/:id updates a post', async ({ apiClient }) => {
    const response = await apiClient.updatePost(1, updatePostPayload);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.title).toBe(updatePostPayload.title);
  });

  test('PATCH /posts/:id partially updates a post', async ({ apiClient }) => {
    const response = await apiClient.patchPost(1, { title: 'patched title only' });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.title).toBe('patched title only');
  });

  test('DELETE /posts/:id removes a post', async ({ apiClient }) => {
    const response = await apiClient.deletePost(1);

    expect(response.status()).toBe(200);
  });
});
