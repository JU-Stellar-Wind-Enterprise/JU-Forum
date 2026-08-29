import * as posts from "@/repositories/post.repository";
import { findSubforumById } from "@/repositories/subforum.repository";
import type { ActionResult } from "@/types/result";

/**
 * Validates and creates a post using the authenticated user as its author.
 *
 * @param input - The post fields together with the author and destination subforum IDs.
 * @returns A result containing the new post ID, or a user-facing validation error.
 * @throws If an unexpected repository or database operation fails.
 */
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

/**
 * Retrieves a post and its public author and subforum details.
 *
 * @param id - The unique ID of the post to retrieve.
 * @returns The matching post, or `null` when no post has that ID.
 * @throws If the database query fails.
 */
export const findPostById = (id: string) => posts.findPostById(id);
