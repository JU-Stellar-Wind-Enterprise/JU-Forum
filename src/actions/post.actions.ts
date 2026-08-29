"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as postService from "@/services/post.service";
import type { ActionResult } from "@/types/result";

/**
 * Creates a post from untrusted form data for the current active user.
 *
 * @param _ - The previous action state supplied by React. It is unused.
 * @param formData - Form data containing the post title, content, and subforum ID.
 * @returns A validation or authorization result when creation does not redirect.
 * @throws A Next.js redirect signal after the post is created successfully.
 */
export async function createPostAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE")
    return { message: "You must be logged in." };
  const result = await postService.createPost({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    subforumId: String(formData.get("subforumId") || ""),
    authorId: user.id,
  });
  if (result.success) redirect(`/post/${result.data?.id}`);
  return result;
}
