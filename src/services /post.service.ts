import * as posts from "@/repositories/post.repository";
import { findSubforumById } from "@/repositories/subforum.repository";
import type { ActionResult } from "@/types/result";

/** Validates and creates a post using the authenticated user as its author. */
export async function createPost(input: {
  title: string;
  content: string;
  authorId: string;
  subforumId: string;
}): Promise<ActionResult<{ id: string }>> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { message: "Title and content are required." };
  if (title.length > 150)
    return { message: "Title must be 150 characters or less." };
  if (content.length > 10_000)
    return { message: "Content must be 10,000 characters or less." };
  const subforum = await findSubforumById(input.subforumId);
  if (!subforum || !subforum.isApproved)
    return { message: "Select a valid subforum." };
  const post = await posts.createPost({ ...input, title, content });
  return { success: true, data: { id: post.id } };
}

/** Retrieves a post for its detail page. */
export const findPostById = (id: string) => posts.findPostById(id);