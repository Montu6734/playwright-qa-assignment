import { test, expect } from '../../src/fixtures/test-fixtures';
import { newPostPayload } from '../../src/test-data/api-payloads';

test.describe('Chained API Testing', () => {
  test('list posts then fetch the detail of the first post returned', async ({ apiClient }) => {
    const listResponse = await apiClient.getPosts();
    const listBody = await listResponse.json();
    const firstPostId = listBody[0].id as number;

    const detailResponse = await apiClient.getPost(firstPostId);
    const detailBody = await detailResponse.json();

    expect(detailResponse.status()).toBe(200);
    expect(detailBody.id).toBe(firstPostId);
    expect(detailBody.title).toBe(listBody[0].title);
  });

  test('fetch a post then fetch its comments', async ({ apiClient }) => {
    const postResponse = await apiClient.getPost(1);
    const post = await postResponse.json();

    const commentsResponse = await apiClient.getComments(post.id);
    const comments = await commentsResponse.json();

    expect(commentsResponse.status()).toBe(200);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments.every((comment: { postId: number }) => comment.postId === post.id)).toBe(true);
  });

  test('create a post then update and delete it using the returned id', async ({ apiClient }) => {
    const createResponse = await apiClient.createPost(newPostPayload);
    const createBody = await createResponse.json();
    const newPostId = Number(createBody.id);

    // JSONPlaceholder's fake backend does not persist writes, so a freshly
    // created id is not retrievable via a later GET — but its mutation
    // endpoints accept any id and return 200 regardless of prior existence,
    // so the chain continues with PATCH/DELETE rather than GET.
    const patchResponse = await apiClient.patchPost(newPostId, { title: 'updated title' });
    expect(patchResponse.status()).toBe(200);

    const deleteResponse = await apiClient.deletePost(newPostId);
    expect(deleteResponse.status()).toBe(200);
  });
});
