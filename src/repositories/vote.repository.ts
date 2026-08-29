import type { VoteType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Finds one user's existing vote on a post.
 *
 * @param userId - The unique ID of the voting user.
 * @param postId - The unique ID of the voted post.
 * @returns The matching vote, or `null` when the user has not voted.
 * @throws If the database query fails.
 */
export const findVote = (userId: string, postId: string) =>
  prisma.postVote.findUnique({ where: { userId_postId: { userId, postId } } });

/**
 * Creates a vote for a post.
 *
 * @param userId - The unique ID of the voting user.
 * @param postId - The unique ID of the voted post.
 * @param type - Whether the new vote is an upvote or downvote.
 * @returns The newly created vote record.
 * @throws If the vote already exists, a relation is missing, or the write fails.
 */
export const createVote = (userId: string, postId: string, type: VoteType) =>
  prisma.postVote.create({ data: { userId, postId, type } });

/**
 * Changes an existing post vote to the opposite vote type.
 *
 * @param userId - The unique ID of the voting user.
 * @param postId - The unique ID of the voted post.
 * @param type - The replacement upvote or downvote value.
 * @returns The updated vote record.
 * @throws If the vote does not exist or the database write fails.
 */
export const updateVote = (userId: string, postId: string, type: VoteType) =>
  prisma.postVote.update({
    where: { userId_postId: { userId, postId } },
    data: { type },
  });

/**
 * Removes an existing post vote.
 *
 * @param userId - The unique ID of the voting user.
 * @param postId - The unique ID of the voted post.
 * @returns The deleted vote record.
 * @throws If the vote does not exist or the database write fails.
 */
export const deleteVote = (userId: string, postId: string) =>
  prisma.postVote.delete({ where: { userId_postId: { userId, postId } } });

/**
 * Calculates vote totals and the requesting user's current vote for a post.
 *
 * @param postId - The post whose votes should be counted.
 * @param userId - The viewer whose current vote should be returned.
 * @returns Upvote and downvote totals plus the viewer's vote or `null`.
 * @throws If any database query fails.
 */
export async function getVoteSummary(postId: string, userId: string) {
  const [upvotes, downvotes, current] = await Promise.all([
    prisma.postVote.count({ where: { postId, type: "UPVOTE" } }),
    prisma.postVote.count({ where: { postId, type: "DOWNVOTE" } }),
    findVote(userId, postId),
  ]);
  return { upvotes, downvotes, currentVote: current?.type ?? null };
}