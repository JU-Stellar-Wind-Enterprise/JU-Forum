import type { VoteType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Finds one user's existing vote on a post. */
export const findVote = (userId: string, postId: string) =>
  prisma.postVote.findUnique({ where: { userId_postId: { userId, postId } } });

/** Creates a vote for a post. */
export const createVote = (userId: string, postId: string, type: VoteType) =>
  prisma.postVote.create({ data: { userId, postId, type } });

/** Changes an existing post vote. */
export const updateVote = (userId: string, postId: string, type: VoteType) =>
  prisma.postVote.update({
    where: { userId_postId: { userId, postId } },
    data: { type },
  });

/** Removes an existing post vote. */
export const deleteVote = (userId: string, postId: string) =>
  prisma.postVote.delete({ where: { userId_postId: { userId, postId } } });

/** Returns totals and the requesting user's current vote for a post. */
export async function getVoteSummary(postId: string, userId: string) {
  const [upvotes, downvotes, current] = await Promise.all([
    prisma.postVote.count({ where: { postId, type: "UPVOTE" } }),
    prisma.postVote.count({ where: { postId, type: "DOWNVOTE" } }),
    findVote(userId, postId),
  ]);
  return { upvotes, downvotes, currentVote: current?.type ?? null };
}