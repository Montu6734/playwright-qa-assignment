import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface PostPayload {
  title: string;
  body: string;
  userId: number;
}

export class PostsClient {
  constructor(private readonly request: APIRequestContext) {}

  getPosts(userId?: number): Promise<APIResponse> {
    return this.request.get('/posts', userId ? { params: { userId } } : undefined);
  }

  getPost(id: number): Promise<APIResponse> {
    return this.request.get(`/posts/${id}`);
  }

  createPost(payload: PostPayload): Promise<APIResponse> {
    return this.request.post('/posts', { data: payload });
  }

  updatePost(id: number, payload: Partial<PostPayload>): Promise<APIResponse> {
    return this.request.put(`/posts/${id}`, { data: payload });
  }

  patchPost(id: number, payload: Partial<PostPayload>): Promise<APIResponse> {
    return this.request.patch(`/posts/${id}`, { data: payload });
  }

  deletePost(id: number): Promise<APIResponse> {
    return this.request.delete(`/posts/${id}`);
  }

  getComments(postId: number): Promise<APIResponse> {
    return this.request.get(`/posts/${postId}/comments`);
  }
}
