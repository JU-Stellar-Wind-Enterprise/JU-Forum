import type { VoteType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Creates a comment or nested reply under a discussion post.
 *
 * @param data - The comment content, post ID, author ID, and optional parent comment ID.
 * @returns The newly created comment record.
 * @throws If a foreign key constraint fails or the database write fails.
 */
export const createComment = (data: {
  content: string;
  postId: string;
  authorId: string;
  parentId: string | null;
}) => prisma.comment.create({ data });

/**
 * Finds a single comment by its unique ID.
 *
 * @param id - The comment ID to look up.
 * @returns The matching comment record, or `null` when it does not exist.
 * @throws If the database query fails.
 */
export const findCommentById = (id: string) =>
  prisma.comment.findUnique({ where: { id } });

/**
 * Updates the text content of an existing comment.
 *
 * @param id - The unique ID of the comment to update.
 * @param content - The validated replacement comment text.
 * @returns The updated comment record.
 * @throws If the comment does not exist or the database write fails.
 */
export const updateComment = (id: string, content: string) =>
  prisma.comment.update({ where: { id }, data: { content } });

/**
 * Marks a comment as soft-deleted while preserving thread structure for replies.
 *
 * @param id - The unique ID of the comment to soft-delete.
 * @returns The updated comment record with `isDeleted` set to `true`.
 * @throws If the comment does not exist or the database write fails.
 */
export const softDeleteComment = (id: string) =>
  prisma.comment.update({ where: { id }, data: { isDeleted: true } });

/**
 * Lists all comments for a post from oldest to newest with author and vote details.
 *
 * @param postId - The unique ID of the post whose comments should be loaded.
 * @returns Flat comment records ordered chronologically for tree assembly.
 * @throws If the database query fails.
 */
export const listCommentsByPost = (postId: string) =>
  prisma.comment.findMany({
    where: { postId },
    include: {
      author: { select: { id: true, name: true, role: true } },
      votes: { select: { userId: true, type: true } },
    },
    orderBy: { createdAt: "asc" },
  });

/**
 * Checks whether a user owns or is assigned as a moderator for a subforum.
 *
 * @param userId - The unique ID of the user being checked.
 * @param subforumId - The unique ID of the subforum containing the post.
 * @returns `true` if the user owns or moderates the subforum; otherwise `false`.
 * @throws If the database queries fail.
 */
export async function isSubforumModerator(
  userId: string,
  subforumId: string,
): Promise<boolean> {
  const [subforum, assigned] = await Promise.all([
    prisma.subforum.findUnique({
      where: { id: subforumId },
      select: { ownerId: true },
    }),
    prisma.subforumModerator.findUnique({
      where: { userId_subforumId: { userId, subforumId } },
      select: { userId: true },
    }),
  ]);
  return subforum?.ownerId === userId || Boolean(assigned);
}

/**
 * Finds one user's existing vote on a comment.
 *
 * @param userId - The unique ID of the voting user.
 * @param commentId - The unique ID of the voted comment.
 * @returns The matching vote record, or `null` when the user has not voted.
 * @throws If the database query fails.
 */
export const findCommentVote = (userId: string, commentId: string) =>
  prisma.commentVote.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

/**
 * Creates a vote on a comment.
 *
 * @param userId - The unique ID of the voting user.
 * @param commentId - The unique ID of the voted comment.
 * @param type - Whether the vote is an upvote or downvote.
 * @returns The newly created vote record.
 * @throws If a constraint is violated or the database write fails.
 */
export const createCommentVote = (
  userId: string,
  commentId: string,
  type: VoteType,
) => prisma.commentVote.create({ data: { userId, commentId, type } });

/**
 * Updates an existing comment vote to the opposite vote type.
 *
 * @param userId - The unique ID of the voting user.
 * @param commentId - The unique ID of the voted comment.
 * @param type - The replacement upvote or downvote value.
 * @returns The updated vote record.
 * @throws If the vote does not exist or the database write fails.
 */
export const updateCommentVote = (
  userId: string,
  commentId: string,
  type: VoteType,
) =>
  prisma.commentVote.update({
    where: { userId_commentId: { userId, commentId } },
    data: { type },
  });

/**
 * Removes an existing vote from a comment.
 *
 * @param userId - The unique ID of the voting user.
 * @param commentId - The unique ID of the voted comment.
 * @returns The deleted vote record.
 * @throws If the vote does not exist or the database write fails.
 */
export const deleteCommentVote = (userId: string, commentId: string) =>
  prisma.commentVote.delete({
    where: { userId_commentId: { userId, commentId } },
  });
