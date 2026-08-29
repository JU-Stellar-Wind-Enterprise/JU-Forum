"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAnnouncement } from "@/services/announcement.service";
import type { ActionResult } from "@/types/result";

/**
 * Creates an announcement from untrusted form data for the current active user.
 *
 * @param _ - The previous action state supplied by React. It is unused.
 * @param formData - Form data containing announcement content and publication options.
 * @returns A validation or authorization result when creation does not redirect.
 * @throws A Next.js redirect signal after the announcement is published.
 */
export async function createAnnouncementAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE")
    return { message: "You must be logged in." };
  const result = await createAnnouncement({
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    priority: String(formData.get("priority") || "MEDIUM"),
    targetAudience: String(formData.get("targetAudience") || "ALL"),
    expiresAt: String(formData.get("expiresAt") || ""),
    authorId: user.id,
    authorRole: user.role,
  });
  if (result.success) redirect(`/announcement/${result.data?.id}`);
  return result;
}