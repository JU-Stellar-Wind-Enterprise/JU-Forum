"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  dismissReport,
  resolveReport,
  submitReport,
} from "@/services/report.service";
import type { ActionResult } from "@/types/result";

/**
 * Server action to submit a content report on a post, comment, or announcement.
 *
 * @param _ - The previous form action state.
 * @param formData - Form data containing target identifiers, report reason, and remarks.
 * @returns Result indicating success or user-facing error message.
 */
export async function submitReportAction(
  _: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { message: "You must be logged in." };
  }

  const reason = String(formData.get("reason") || "");
  const remarks = String(formData.get("remarks") || "");
  const postId = formData.get("postId")
    ? String(formData.get("postId"))
    : undefined;
  const commentId = formData.get("commentId")
    ? String(formData.get("commentId"))
    : undefined;
  const announcementId = formData.get("announcementId")
    ? String(formData.get("announcementId"))
    : undefined;

  const result = await submitReport({
    reporterId: user.id,
    reason,
    remarks,
    postId,
    commentId,
    announcementId,
  });

  if (result.success) {
    if (postId) revalidatePath(`/post/${postId}`);
    if (announcementId) revalidatePath(`/announcement/${announcementId}`);
    revalidatePath("/moderation/reports");
  }

  return result;
}

/**
 * Server action to dismiss a report as unfounded.
 *
 * @param reportId - The unique ID of the report to dismiss.
 * @param reviewNotes - Optional notes explaining the dismissal.
 * @returns Result indicating success or authorization error.
 */
export async function dismissReportAction(
  reportId: string,
  reviewNotes?: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { message: "You must be logged in." };
  }

  const result = await dismissReport({
    reportId,
    reviewerId: user.id,
    reviewerRole: user.role,
    reviewNotes,
  });

  if (result.success) {
    revalidatePath("/moderation/reports");
  }

  return result;
}

/**
 * Server action to resolve a report after moderator review.
 *
 * @param reportId - The unique ID of the report being resolved.
 * @param reviewNotes - Optional notes explaining corrective action.
 * @returns Result indicating success or error.
 */
export async function resolveReportAction(
  reportId: string,
  reviewNotes?: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { message: "You must be logged in." };
  }

  const result = await resolveReport({
    reportId,
    reviewerId: user.id,
    reviewerRole: user.role,
    reviewNotes,
  });

  if (result.success) {
    revalidatePath("/moderation/reports");
  }

  return result;
}
