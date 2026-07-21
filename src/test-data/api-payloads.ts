import type { PostPayload } from '../api/PostsClient';

export const newPostPayload: PostPayload = {
  title: 'A new post created by the automation suite',
  body: 'This post was created via the PostsClient in an automated test.',
  userId: 1,
};

export const updatePostPayload: PostPayload = {
  title: 'An updated post title',
  body: 'This post body was updated via the automation suite.',
  userId: 1,
};
