"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as commentService from "@/services/comment.service";
import type { ActionResult } from "@/types/result";

/**
 * Creates a comment or nested reply from submitted form data for the active user.
 *
 * @param _ - Previous action state supplied by React. Unused.
 * @param formData - Form data containing `postId`, `content`, and optional `parentId`.
 * @returns A validation or persistence result, or redirects to `/login` if unauthenticated.
 */
export async function createCommentAction(
  _: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }> | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("postId") || "");
  const parentIdRaw = formData.get("parentId");
  const parentId = parentIdRaw ? String(parentIdRaw) : null;
  const content = String(formData.get("content") || "");

  const result = await commentService.createComment({
    postId,
    authorId: user.id,
    content,
    parentId,
    authorStatus: user.status,
  });

  if (result.success && postId) {
    revalidatePath(`/post/${postId}`);
  }
  return result;
}

/**
 * Updates an existing comment authored by the current active user.
 *
 * @param _ - Previous action state supplied by React. Unused.
 * @param formData - Form data containing `commentId`, `postId`, and updated `content`.
 * @returns A validation, authorization, or persistence result.
 */
export async function editCommentAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commentId = String(formData.get("commentId") || "");
  const postId = String(formData.get("postId") || "");
  const content = String(formData.get("content") || "");

  const result = await commentService.editComment({
    commentId,
    userId: user.id,
    content,
    userStatus: user.status,
  });

  if (result.success && postId) {
    revalidatePath(`/post/${postId}`);
  }
  return result;
}

/**
 * Soft-deletes a comment when requested by its author, a subforum moderator/owner, or an admin.
 *
 * @param _ - Previous action state supplied by React. Unused.
 * @param formData - Form data containing `commentId` and `postId`.
 * @returns A success or error result for the deletion request.
 */
export async function deleteCommentAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commentId = String(formData.get("commentId") || "");
  const postId = String(formData.get("postId") || "");

  const result = await commentService.deleteComment({
    commentId,
    userId: user.id,
    userRole: user.role,
    userStatus: user.status,
  });

  if (result.success && postId) {
    revalidatePath(`/post/${postId}`);
  }
  return result;
}

/**
 * Casts, toggles, or switches the current user's vote on a comment.
 *
 * @param _ - Previous action state supplied by React. Unused.
 * @param formData - Form data containing `commentId`, `postId`, and `type` (`UPVOTE` or `DOWNVOTE`).
 * @returns A success or error result for the vote request.
 */
export async function voteCommentAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commentId = String(formData.get("commentId") || "");
  const postId = String(formData.get("postId") || "");
  const type = String(formData.get("type") || "");

  if (type !== "UPVOTE" && type !== "DOWNVOTE") {
    return { message: "Invalid vote type." };
  }

  const result = await commentService.voteOnComment({
    commentId,
    userId: user.id,
    type,
    userStatus: user.status,
  });

  if (result.success && postId) {
    revalidatePath(`/post/${postId}`);
  }
  return result;
}
