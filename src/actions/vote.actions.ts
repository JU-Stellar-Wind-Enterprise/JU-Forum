"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { voteOnPost } from "@/services/vote.service";

/**
 * Applies a post vote after authenticating and validating the current user.
 *
 * @param formData - Form data containing the post ID and requested vote type.
 * @returns A promise that resolves after voting or silently ignores invalid input.
 * @throws If an unexpected database or path revalidation error occurs.
 */
export async function voteAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;
  const type = String(formData.get("type"));
  if (type !== "UPVOTE" && type !== "DOWNVOTE") return;
  const postId = String(formData.get("postId") || "");
  const result = await voteOnPost({ postId, userId: user.id, type });
  if (result.success) revalidatePath(`/post/${postId}`);
}
