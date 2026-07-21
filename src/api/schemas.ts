import { z } from 'zod';

export const PostSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  body: z.string(),
});
export type Post = z.infer<typeof PostSchema>;

export const PostListResponseSchema = z.array(PostSchema);

// The fake backend echoes back the submitted payload plus a newly assigned id,
// so title/body are only guaranteed present when the create payload sent them.
export const CreatePostResponseSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  userId: z.number().optional(),
});
export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>;

export const CommentSchema = z.object({
  postId: z.number(),
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  body: z.string(),
});

export const CommentListResponseSchema = z.array(CommentSchema);
