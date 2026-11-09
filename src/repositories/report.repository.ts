import type { ReportReason, ReportStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export interface CreateReportData {
  reason: ReportReason;
  remarks?: string | null;
  reporterId: string;
  postId?: string | null;
  commentId?: string | null;
  announcementId?: string | null;
}

/**
 * Creates a report in the database with the given attributes.
 *
 * @param data - The report parameters including reason, reporter, and content targets.
 * @returns The newly created report record with relations.
 */
export async function createReport(data: CreateReportData) {
  return prisma.report.create({
    data: {
      reason: data.reason,
      remarks: data.remarks?.trim() || null,
      reporterId: data.reporterId,
      postId: data.postId || null,
      commentId: data.commentId || null,
      announcementId: data.announcementId || null,
    },
    include: {
      reporter: {
        select: { id: true, name: true, email: true, role: true },
      },
      post: {
        select: { id: true, title: true },
      },
      comment: {
        select: { id: true, content: true, isDeleted: true },
      },
      announcement: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Finds a report by its unique ID.
 *
 * @param id - The report record ID.
 * @returns The report record with full details, or null if not found.
 */
export async function findReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: {
        select: { id: true, name: true, email: true, role: true },
      },
      reviewedBy: {
        select: { id: true, name: true, role: true },
      },
      post: {
        select: { id: true, title: true, content: true, authorId: true },
      },
      comment: {
        select: { id: true, content: true, authorId: true, isDeleted: true },
      },
      announcement: {
        select: { id: true, title: true, content: true, authorId: true },
      },
    },
  });
}

/**
 * Finds an existing report by the same reporter on the specified content item.
 *
 * @param params - Reporter ID and content target ID.
 * @returns The existing report if found, or null.
 */
export async function findExistingReport(params: {
  reporterId: string;
  postId?: string | null;
  commentId?: string | null;
  announcementId?: string | null;
}) {
  if (params.postId) {
    return prisma.report.findFirst({
      where: {
        reporterId: params.reporterId,
        postId: params.postId,
      },
    });
  }

  if (params.commentId) {
    return prisma.report.findFirst({
      where: {
        reporterId: params.reporterId,
        commentId: params.commentId,
      },
    });
  }

  if (params.announcementId) {
    return prisma.report.findFirst({
      where: {
        reporterId: params.reporterId,
        announcementId: params.announcementId,
      },
    });
  }

  return null;
}

/**
 * Lists reports matching the specified filter criteria.
 *
 * @param filters - Optional filters such as status or specific content target.
 * @returns An array of reports ordered from newest to oldest.
 */
export async function listReports(filters?: {
  status?: ReportStatus;
  postId?: string;
  commentId?: string;
  announcementId?: string;
}) {
  const where: {
    status?: ReportStatus;
    postId?: string;
    commentId?: string;
    announcementId?: string;
  } = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.postId) where.postId = filters.postId;
  if (filters?.commentId) where.commentId = filters.commentId;
  if (filters?.announcementId) where.announcementId = filters.announcementId;

  return prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, email: true, role: true },
      },
      reviewedBy: {
        select: { id: true, name: true, role: true },
      },
      post: {
        select: { id: true, title: true },
      },
      comment: {
        select: { id: true, content: true, isDeleted: true },
      },
      announcement: {
        select: { id: true, title: true },
      },
    },
  });
}

/**
 * Updates a report's status, reviewer, notes, and timestamp.
 *
 * @param params - The update arguments.
 * @returns The updated report.
 */
export async function updateReportStatus(params: {
  id: string;
  status: ReportStatus;
  reviewedById: string;
  reviewNotes?: string | null;
}) {
  return prisma.report.update({
    where: { id: params.id },
    data: {
      status: params.status,
      reviewedById: params.reviewedById,
      reviewNotes: params.reviewNotes?.trim() || null,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Verifies if a post exists and is available.
 *
 * @param id - The post ID.
 * @returns The post record or null.
 */
export async function findTargetPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
}

/**
 * Verifies if a comment exists and checks its deletion state.
 *
 * @param id - The comment ID.
 * @returns The comment record or null.
 */
export async function findTargetComment(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    select: { id: true, content: true, isDeleted: true },
  });
}

/**
 * Verifies if an announcement exists and is available.
 *
 * @param id - The announcement ID.
 * @returns The announcement record or null.
 */
export async function findTargetAnnouncement(id: string) {
  return prisma.announcement.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
}
