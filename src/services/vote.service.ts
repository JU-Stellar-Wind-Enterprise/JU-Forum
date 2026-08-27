import type { VoteType } from "@/generated/prisma/client";
import { findPostById } from "@/repositories/post.repository";
import * as votes from "@/repositories/vote.repository";
import type { ActionResult } from "@/types/result";

/** Applies create, undo, or switch semantics to a user's post vote. */
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

/** Gets display totals and the user's selected vote. */
export const getVoteSummary = (postId: string, userId: string) =>
  votes.getVoteSummary(postId, userId);