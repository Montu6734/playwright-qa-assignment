import { test, expect } from '../../src/fixtures/test-fixtures';
import { PostListResponseSchema, PostSchema, CreatePostResponseSchema, CommentListResponseSchema } from '../../src/api/schemas';
import { newPostPayload } from '../../src/test-data/api-payloads';

test.describe('API Response Schema Validation', () => {
  test('GET /posts list response matches the expected schema', async ({ apiClient }) => {
    const response = await apiClient.getPosts();
    const body = await response.json();

    expect(() => PostListResponseSchema.parse(body)).not.toThrow();
  });

  test('GET /posts/:id single response matches the expected schema', async ({ apiClient }) => {
    const response = await apiClient.getPost(1);
    const body = await response.json();

    expect(() => PostSchema.parse(body)).not.toThrow();
  });

  test('POST /posts create response matches the expected schema', async ({ apiClient }) => {
    const response = await apiClient.createPost(newPostPayload);
    const body = await response.json();

    expect(() => CreatePostResponseSchema.parse(body)).not.toThrow();
  });

  test('GET /posts/:id/comments response matches the expected schema', async ({ apiClient }) => {
    const response = await apiClient.getComments(1);
    const body = await response.json();

    expect(() => CommentListResponseSchema.parse(body)).not.toThrow();
  });
});
