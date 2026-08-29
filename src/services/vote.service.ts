import type { VoteType } from "@/generated/prisma/client";
import { findPostById } from "@/repositories/post.repository";
import * as votes from "@/repositories/vote.repository";
import type { ActionResult } from "@/types/result";

/**
 * Applies create, undo, or switch semantics to a user's post vote.
 *
 * @param input - The post ID, voting user ID, and requested vote type.
 * @returns A success result, or an error when the post cannot be voted on.
 * @throws If an unexpected vote or post repository operation fails.
 */
export async function voteOnPost(input: {
  postId: string;
  userId: string;
  type: VoteType;
}): Promise<ActionResult> {
  const post = await findPostById(input.postId);
  if (!post) return { message: "Post not found." };
  if (post.isLocked || post.isArchived)
    return { message: "Voting is disabled for this post." };
  const existing = await votes.findVote(input.userId, input.postId);
  if (!existing) await votes.createVote(input.userId, input.postId, input.type);
  else if (existing.type === input.type)
    await votes.deleteVote(input.userId, input.postId);
  else await votes.updateVote(input.userId, input.postId, input.type);
  return { success: true };
}

/**
 * Gets the vote totals and current user's selected vote for a post.
 *
 * @param postId - The post whose votes should be summarized.
 * @param userId - The viewer whose current vote should be included.
 * @returns Upvote and downvote totals together with the viewer's current vote.
 * @throws If the database queries fail.
 */
export const getVoteSummary = (postId: string, userId: string) =>
  votes.getVoteSummary(postId, userId);