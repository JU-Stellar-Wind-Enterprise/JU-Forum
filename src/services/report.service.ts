import type {
  ReportReason,
  ReportStatus,
  UserRole,
} from "@/generated/prisma/enums";
import * as reportRepo from "@/repositories/report.repository";
import type { ActionResult } from "@/types/result";

/**
 * Valid report reasons recognized by the forum's content moderation system.
 */
export const validReportReasons: ReportReason[] = [
  "SPAM",
  "HARASSMENT",
  "OFFENSIVE",
  "FALSE_INFORMATION",
  "ACADEMIC_MISCONDUCT",
  "OTHER",
];

const moderatorRoles: UserRole[] = ["MODERATOR", "ADMIN", "SYSTEM_ADMIN"];

/**
 * Checks whether a user role has authority to view or review content reports.
 *
 * @param role - The role of the user.
 * @returns `true` if authorized to moderate reports; otherwise `false`.
 */
export const canModerateReports = (role: UserRole): boolean =>
  moderatorRoles.includes(role);

export interface SubmitReportInput {
  reporterId: string;
  reason: string;
  remarks?: string;
  postId?: string;
  commentId?: string;
  announcementId?: string;
}

export interface ReviewReportInput {
  reportId: string;
  reviewerId: string;
  reviewerRole: UserRole;
  reviewNotes?: string;
}

/**
 * Validates and submits a new content report for moderator review.
 *
 * @param input - The report submission payload including reporter, reason, and target.
 * @returns A result indicating success or a specific validation error message.
 */
export async function submitReport(
  input: SubmitReportInput,
): Promise<ActionResult<{ id: string }>> {
  if (
    !input.reason ||
    !validReportReasons.includes(input.reason as ReportReason)
  ) {
    return { message: "Please select a valid reason for reporting." };
  }

  if (!input.postId && !input.commentId && !input.announcementId) {
    return { message: "This content is no longer available." };
  }

  if (input.postId) {
    const post = await reportRepo.findTargetPost(input.postId);
    if (!post) {
      return { message: "This content is no longer available." };
    }
  } else if (input.commentId) {
    const comment = await reportRepo.findTargetComment(input.commentId);
    if (!comment || comment.isDeleted) {
      return { message: "This content is no longer available." };
    }
  } else if (input.announcementId) {
    const announcement = await reportRepo.findTargetAnnouncement(
      input.announcementId,
    );
    if (!announcement) {
      return { message: "This content is no longer available." };
    }
  }

  const existingReport = await reportRepo.findExistingReport({
    reporterId: input.reporterId,
    postId: input.postId,
    commentId: input.commentId,
    announcementId: input.announcementId,
  });

  if (existingReport) {
    return { message: "You have already reported this content." };
  }

  const remarks = input.remarks?.trim();
  if (remarks && remarks.length > 1000) {
    return { message: "Remarks must be 1,000 characters or less." };
  }

  try {
    const created = await reportRepo.createReport({
      reporterId: input.reporterId,
      reason: input.reason as ReportReason,
      remarks,
      postId: input.postId,
      commentId: input.commentId,
      announcementId: input.announcementId,
    });

    return {
      success: true,
      message:
        "Thank you. Your report has been submitted for moderator review.",
      data: { id: created.id },
    };
  } catch {
    return { message: "Failed to submit report. Please try again." };
  }
}

/**
 * Retrieves the moderation review queue for authorized moderators and administrators.
 *
 * @param userRole - The role of the inquiring user.
 * @param filters - Optional filters such as report status.
 * @returns A list of reports or an authorization failure result.
 */
export async function listModerationReports(
  userRole: UserRole,
  filters?: {
    status?: ReportStatus;
    postId?: string;
    commentId?: string;
    announcementId?: string;
  },
): Promise<ActionResult<Awaited<ReturnType<typeof reportRepo.listReports>>>> {
  if (!canModerateReports(userRole)) {
    return {
      message: "You do not have permission to view moderation reports.",
    };
  }

  try {
    const reports = await reportRepo.listReports(filters);
    return { success: true, data: reports };
  } catch {
    return { message: "Failed to retrieve moderation reports." };
  }
}

/**
 * Retrieves comprehensive report details for moderator inspection.
 *
 * @param userRole - The role of the inquiring user.
 * @param reportId - The unique ID of the report.
 * @returns The report record or an error result.
 */
export async function getReportDetails(
  userRole: UserRole,
  reportId: string,
): Promise<
  ActionResult<
    NonNullable<Awaited<ReturnType<typeof reportRepo.findReportById>>>
  >
> {
  if (!canModerateReports(userRole)) {
    return { message: "You do not have permission to view this report." };
  }

  const report = await reportRepo.findReportById(reportId);
  if (!report) {
    return { message: "Report not found." };
  }

  return { success: true, data: report };
}

/**
 * Dismisses an unfounded report from the moderation queue.
 *
 * @param input - The review details including reviewer ID, role, and optional remarks.
 * @returns The action result indicating success or error.
 */
export async function dismissReport(
  input: ReviewReportInput,
): Promise<ActionResult<{ id: string }>> {
  if (!canModerateReports(input.reviewerRole)) {
    return { message: "You do not have permission to review reports." };
  }

  const existing = await reportRepo.findReportById(input.reportId);
  if (!existing) {
    return { message: "Report not found." };
  }

  try {
    await reportRepo.updateReportStatus({
      id: input.reportId,
      status: "DISMISSED",
      reviewedById: input.reviewerId,
      reviewNotes: input.reviewNotes,
    });

    return {
      success: true,
      message: "Report has been dismissed.",
      data: { id: input.reportId },
    };
  } catch {
    return { message: "Failed to dismiss report. Please try again." };
  }
}

/**
 * Resolves a valid report after corrective action has been performed.
 *
 * @param input - The review details including reviewer ID, role, and optional remarks.
 * @returns The action result indicating success or error.
 */
export async function resolveReport(
  input: ReviewReportInput,
): Promise<ActionResult<{ id: string }>> {
  if (!canModerateReports(input.reviewerRole)) {
    return { message: "You do not have permission to review reports." };
  }

  const existing = await reportRepo.findReportById(input.reportId);
  if (!existing) {
    return { message: "Report not found." };
  }

  try {
    await reportRepo.updateReportStatus({
      id: input.reportId,
      status: "RESOLVED",
      reviewedById: input.reviewerId,
      reviewNotes: input.reviewNotes,
    });

    return {
      success: true,
      message: "Report has been resolved.",
      data: { id: input.reportId },
    };
  } catch {
    return { message: "Failed to resolve report. Please try again." };
  }
}
