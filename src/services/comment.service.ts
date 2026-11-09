import type {
  AccountStatus,
  UserRole,
  VoteType,
} from "@/generated/prisma/client";
import * as comments from "@/repositories/comment.repository";
import { findPostById } from "@/repositories/post.repository";
import type { ActionResult } from "@/types/result";

const MAX_COMMENT_LENGTH = 2000;
const GLOBAL_MODERATOR_ROLES: UserRole[] = [
  "MODERATOR",
  "ADMIN",
  "SYSTEM_ADMIN",
];

/**
 * Represents a comment node in a nested discussion thread tree.
 */
export type CommentNode = {
  id: string;
  content: string;
  isDeleted: boolean;
  isEdited: boolean;
  postId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  upvotes: number;
  downvotes: number;
  score: number;
  currentVote: VoteType | null;
  replies: CommentNode[];
};

function validateCommentContent(
  rawContent: string,
): { ok: true; content: string } | { ok: false; error: ActionResult } {
  const content = rawContent.trim();
  if (!content) {
    return { ok: false, error: { message: "Comment cannot be empty." } };
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      error: { message: "Comment must be 2,000 characters or less." },
    };
  }
  return { ok: true, content };
}

function checkActiveStatus(
  status: AccountStatus | undefined,
  context: "discussion" | "vote",
): ActionResult | null {
  if (!status || status === "ACTIVE") return null;
  if (status === "SUSPENDED") {
    return {
      message:
        context === "vote"
          ? "Suspended accounts cannot participate in voting."
          : "Suspended accounts cannot participate in discussions.",
    };
  }
  return { message: "Your account is not active." };
}

/**
 * Checks whether a user has moderation privileges over comments in a subforum.
 *
 * @param userId - The unique ID of the user to check.
 * @param userRole - The user's platform role.
 * @param subforumId - The ID of the subforum containing the post.
 * @returns `true` if the user is a global moderator/admin or subforum moderator/owner.
 * @throws If checking subforum moderation membership fails.
 */
export async function canModerateComments(
  userId: string,
  userRole: UserRole,
  subforumId: string,
): Promise<boolean> {
  if (GLOBAL_MODERATOR_ROLES.includes(userRole)) return true;
  return comments.isSubforumModerator(userId, subforumId);
}

/**
 * Validates and creates a top-level comment or nested reply on an active post.
 *
 * @param input - Target post ID, author ID, comment text, optional parent comment ID, and optional status.
 * @returns A result containing the created comment ID, or a user-facing error message.
 */
export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  authorStatus?: AccountStatus;
}): Promise<ActionResult<{ id: string }>> {
  const statusError = checkActiveStatus(input.authorStatus, "discussion");
  if (statusError) return statusError;

  const validated = validateCommentContent(input.content);
  if (!validated.ok) return validated.error;

  const parentId = input.parentId?.trim() || null;

  try {
    const post = await findPostById(input.postId);
    if (!post) return { message: "Post not found." };
    if (post.isLocked || post.isArchived) {
      return { message: "Comments are closed for this post." };
    }

    if (parentId) {
      const parent = await comments.findCommentById(parentId);
      if (!parent) return { message: "Parent comment not found." };
      if (parent.postId !== input.postId) {
        return { message: "Parent comment does not belong to this post." };
      }
      if (parent.isDeleted) {
        return { message: "Cannot reply to a deleted comment." };
      }
    }

    const created = await comments.createComment({
      postId: input.postId,
      authorId: input.authorId,
      content: validated.content,
      parentId,
    });
    return { success: true, data: { id: created.id } };
  } catch {
    return { message: "Unable to post comment. Please try again." };
  }
}

/**
 * Validates and updates the content of a comment owned by the requesting user.
 *
 * @param input - Comment ID, editor user ID, updated text, and optional account status.
 * @returns A success result, or a user-facing validation or authorization error.
 */
export async function editComment(input: {
  commentId: string;
  userId: string;
  content: string;
  userStatus?: AccountStatus;
}): Promise<ActionResult> {
  const statusError = checkActiveStatus(input.userStatus, "discussion");
  if (statusError) return statusError;

  const validated = validateCommentContent(input.content);
  if (!validated.ok) return validated.error;

  try {
    const existing = await comments.findCommentById(input.commentId);
    if (!existing || existing.isDeleted) {
      return { message: "Comment not found." };
    }
    if (existing.authorId !== input.userId) {
      return { message: "You can only edit your own comments." };
    }

    const post = await findPostById(existing.postId);
    if (!post) return { message: "Post not found." };
    if (post.isLocked || post.isArchived) {
      return { message: "Comments are closed for this post." };
    }

    await comments.updateComment(input.commentId, validated.content);
    return { success: true };
  } catch {
    return { message: "Unable to update comment. Please try again." };
  }
}

/**
 * Soft-deletes a comment when requested by its author, a subforum moderator/owner, or an admin.
 *
 * @param input - Comment ID, acting user ID and role, and optional account status.
 * @returns A success result, or a user-facing error when missing or unauthorized.
 */
export async function deleteComment(input: {
  commentId: string;
  userId: string;
  userRole: UserRole;
  userStatus?: AccountStatus;
}): Promise<ActionResult> {
  const statusError = checkActiveStatus(input.userStatus, "discussion");
  if (statusError) return statusError;

  try {
    const existing = await comments.findCommentById(input.commentId);
    if (!existing || existing.isDeleted) {
      return { message: "Comment not found." };
    }

    if (existing.authorId !== input.userId) {
      const post = await findPostById(existing.postId);
      const isGlobalMod = GLOBAL_MODERATOR_ROLES.includes(input.userRole);
      const isSubMod =
        !isGlobalMod && post
          ? await comments.isSubforumModerator(input.userId, post.subforumId)
          : false;
      if (!isGlobalMod && !isSubMod) {
        return {
          message: "You do not have permission to delete this comment.",
        };
      }
    }

    await comments.softDeleteComment(input.commentId);
    return { success: true };
  } catch {
    return { message: "Unable to delete comment. Please try again." };
  }
}

/**
 * Applies create, undo, or switch semantics to a user's vote on a comment.
 *
 * @param input - Comment ID, voting user ID, vote type, and optional account status.
 * @returns A success result, or an error when voting is disallowed.
 */
export async function voteOnComment(input: {
  commentId: string;
  userId: string;
  type: VoteType;
  userStatus?: AccountStatus;
}): Promise<ActionResult> {
  const statusError = checkActiveStatus(input.userStatus, "vote");
  if (statusError) return statusError;

  try {
    const comment = await comments.findCommentById(input.commentId);
    if (!comment || comment.isDeleted) {
      return { message: "Comment not found." };
    }

    const post = await findPostById(comment.postId);
    if (!post) return { message: "Post not found." };
    if (post.isLocked || post.isArchived) {
      return { message: "Voting is disabled on locked or archived content." };
    }

    const existing = await comments.findCommentVote(
      input.userId,
      input.commentId,
    );
    if (!existing) {
      await comments.createCommentVote(
        input.userId,
        input.commentId,
        input.type,
      );
    } else if (existing.type === input.type) {
      await comments.deleteCommentVote(input.userId, input.commentId);
    } else {
      await comments.updateCommentVote(
        input.userId,
        input.commentId,
        input.type,
      );
    }

    return { success: true };
  } catch {
    return { message: "Unable to record vote. Please try again." };
  }
}

function pruneDeletedComments(nodes: CommentNode[]): CommentNode[] {
  const result: CommentNode[] = [];
  for (const node of nodes) {
    const replies = pruneDeletedComments(node.replies);
    if (node.isDeleted && replies.length === 0) {
      continue;
    }
    result.push({ ...node, replies });
  }
  return result;
}

/**
 * Loads a post's comments, computes vote summaries, and builds a pruned nested reply tree.
 *
 * Soft-deleted comments with active child replies are preserved as `"[deleted]"` placeholders,
 * while soft-deleted leaf comments are omitted.
 *
 * @param postId - The unique ID of the post whose comments should be listed.
 * @param viewerId - Optional current viewer ID used to compute `currentVote`.
 * @returns Root comment nodes containing recursively nested replies.
 * @throws If the database query fails.
 */
export async function listPostComments(
  postId: string,
  viewerId?: string,
): Promise<CommentNode[]> {
  const rows = await comments.listCommentsByPost(postId);
  const nodeMap = new Map<string, CommentNode>();

  for (const row of rows) {
    const upvotes = row.votes.filter((vote) => vote.type === "UPVOTE").length;
    const downvotes = row.votes.filter(
      (vote) => vote.type === "DOWNVOTE",
    ).length;
    const currentVote = viewerId
      ? (row.votes.find((vote) => vote.userId === viewerId)?.type ?? null)
      : null;

    nodeMap.set(row.id, {
      id: row.id,
      content: row.isDeleted ? "[deleted]" : row.content,
      isDeleted: row.isDeleted,
      isEdited:
        !row.isDeleted &&
        row.updatedAt.getTime() - row.createdAt.getTime() > 1000,
      postId: row.postId,
      parentId: row.parentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.isDeleted ? null : row.author,
      upvotes: row.isDeleted ? 0 : upvotes,
      downvotes: row.isDeleted ? 0 : downvotes,
      score: row.isDeleted ? 0 : upvotes - downvotes,
      currentVote: row.isDeleted ? null : currentVote,
      replies: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const row of rows) {
    const node = nodeMap.get(row.id);
    if (!node) continue;
    const parent = row.parentId ? nodeMap.get(row.parentId) : undefined;
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return pruneDeletedComments(roots);
}

/**
 * Counts non-deleted comments across a nested comment tree.
 *
 * @param nodes - The root comment nodes to traverse.
 * @returns Total number of visible non-deleted comments.
 */
export function countVisibleComments(nodes: CommentNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (!node.isDeleted) count += 1;
    count += countVisibleComments(node.replies);
  }
  return count;
}
