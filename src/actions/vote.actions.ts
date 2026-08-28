"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { voteOnPost } from "@/services/vote.service";

/** Applies a post vote after authenticating and validating the current user. */
export async function voteAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;
  const type = String(formData.get("type"));
  if (type !== "UPVOTE" && type !== "DOWNVOTE") return;
  const postId = String(formData.get("postId") || "");
  const result = await voteOnPost({ postId, userId: user.id, type });
  if (result.success) revalidatePath(`/post/${postId}`);
}