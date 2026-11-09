import type {
  Report,
  ReportReason,
  ReportStatus,
  UserRole,
} from "@/generated/prisma/client";
import * as reportRepo from "@/repositories/report.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canModerateReports,
  dismissReport,
  getReportDetails,
  listModerationReports,
  resolveReport,
  submitReport,
  validReportReasons,
} from "./report.service";

type TargetPost = Awaited<ReturnType<typeof reportRepo.findTargetPost>>;
type TargetComment = Awaited<ReturnType<typeof reportRepo.findTargetComment>>;
type TargetAnnouncement = Awaited<
  ReturnType<typeof reportRepo.findTargetAnnouncement>
>;
type ExistingReport = Awaited<ReturnType<typeof reportRepo.findExistingReport>>;
type CreatedReport = Awaited<ReturnType<typeof reportRepo.createReport>>;
type ReportDetail = Awaited<ReturnType<typeof reportRepo.findReportById>>;
type ReportList = Awaited<ReturnType<typeof reportRepo.listReports>>;
type UpdatedReport = Awaited<ReturnType<typeof reportRepo.updateReportStatus>>;

vi.mock("@/repositories/report.repository", () => ({
  createReport: vi.fn(),
  findReportById: vi.fn(),
  findExistingReport: vi.fn(),
  listReports: vi.fn(),
  updateReportStatus: vi.fn(),
  findTargetPost: vi.fn(),
  findTargetComment: vi.fn(),
  findTargetAnnouncement: vi.fn(),
}));

describe("report.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canModerateReports", () => {
    it("returns true for MODERATOR, ADMIN, and SYSTEM_ADMIN", () => {
      const allowedRoles: UserRole[] = ["MODERATOR", "ADMIN", "SYSTEM_ADMIN"];
      for (const role of allowedRoles) {
        expect(canModerateReports(role)).toBe(true);
      }
    });

    it("returns false for regular users: STUDENT, FACULTY, STAFF", () => {
      const disallowedRoles: UserRole[] = ["STUDENT", "FACULTY", "STAFF"];
      for (const role of disallowedRoles) {
        expect(canModerateReports(role)).toBe(false);
      }
    });
  });

  describe("validReportReasons", () => {
    it("includes all SRS specified reasons", () => {
      expect(validReportReasons).toEqual([
        "SPAM",
        "HARASSMENT",
        "OFFENSIVE",
        "FALSE_INFORMATION",
        "ACADEMIC_MISCONDUCT",
        "OTHER",
      ]);
    });
  });

  describe("submitReport", () => {
    const validReporterId = "reporter-123";

    it("rejects report submission if reason is missing or invalid", async () => {
      const result = await submitReport({
        reporterId: validReporterId,
        reason: "",
        postId: "post-1",
      });

      expect(result).toEqual({
        message: "Please select a valid reason for reporting.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report submission if reason is not an allowed enum value", async () => {
      const result = await submitReport({
        reporterId: validReporterId,
        reason: "INVALID_REASON",
        postId: "post-1",
      });

      expect(result).toEqual({
        message: "Please select a valid reason for reporting.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report submission if no target content is specified", async () => {
      const result = await submitReport({
        reporterId: validReporterId,
        reason: "SPAM",
      });

      expect(result).toEqual({
        message: "This content is no longer available.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if reported post does not exist", async () => {
      vi.mocked(reportRepo.findTargetPost).mockResolvedValue(null);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "SPAM",
        postId: "non-existent-post",
      });

      expect(result).toEqual({
        message: "This content is no longer available.",
      });
      expect(reportRepo.findTargetPost).toHaveBeenCalledWith(
        "non-existent-post",
      );
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if reported comment does not exist", async () => {
      vi.mocked(reportRepo.findTargetComment).mockResolvedValue(null);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "HARASSMENT",
        commentId: "non-existent-comment",
      });

      expect(result).toEqual({
        message: "This content is no longer available.",
      });
      expect(reportRepo.findTargetComment).toHaveBeenCalledWith(
        "non-existent-comment",
      );
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if reported comment has isDeleted set to true", async () => {
      vi.mocked(reportRepo.findTargetComment).mockResolvedValue({
        id: "deleted-comment",
        content: "[deleted]",
        isDeleted: true,
      } as unknown as TargetComment);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "HARASSMENT",
        commentId: "deleted-comment",
      });

      expect(result).toEqual({
        message: "This content is no longer available.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if reported announcement does not exist", async () => {
      vi.mocked(reportRepo.findTargetAnnouncement).mockResolvedValue(null);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "FALSE_INFORMATION",
        announcementId: "non-existent-announcement",
      });

      expect(result).toEqual({
        message: "This content is no longer available.",
      });
      expect(reportRepo.findTargetAnnouncement).toHaveBeenCalledWith(
        "non-existent-announcement",
      );
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if user has already reported the specific post", async () => {
      vi.mocked(reportRepo.findTargetPost).mockResolvedValue({
        id: "post-1",
        title: "Test Post",
      } as unknown as TargetPost);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue({
        id: "report-1",
        reporterId: validReporterId,
        postId: "post-1",
      } as unknown as ExistingReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "SPAM",
        postId: "post-1",
      });

      expect(result).toEqual({
        message: "You have already reported this content.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if user has already reported the specific comment", async () => {
      vi.mocked(reportRepo.findTargetComment).mockResolvedValue({
        id: "comment-1",
        content: "Some comment",
        isDeleted: false,
      } as unknown as TargetComment);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue({
        id: "report-2",
        reporterId: validReporterId,
        commentId: "comment-1",
      } as unknown as ExistingReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "OFFENSIVE",
        commentId: "comment-1",
      });

      expect(result).toEqual({
        message: "You have already reported this content.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if user has already reported the specific announcement", async () => {
      vi.mocked(reportRepo.findTargetAnnouncement).mockResolvedValue({
        id: "ann-1",
        title: "Notice",
      } as unknown as TargetAnnouncement);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue({
        id: "report-3",
        reporterId: validReporterId,
        announcementId: "ann-1",
      } as unknown as ExistingReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "ACADEMIC_MISCONDUCT",
        announcementId: "ann-1",
      });

      expect(result).toEqual({
        message: "You have already reported this content.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("rejects report if remarks exceed 1,000 characters", async () => {
      vi.mocked(reportRepo.findTargetPost).mockResolvedValue({
        id: "post-1",
        title: "Test Post",
      } as unknown as TargetPost);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue(null);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "OTHER",
        remarks: "a".repeat(1001),
        postId: "post-1",
      });

      expect(result).toEqual({
        message: "Remarks must be 1,000 characters or less.",
      });
      expect(reportRepo.createReport).not.toHaveBeenCalled();
    });

    it("successfully creates a report on a post with remarks", async () => {
      vi.mocked(reportRepo.findTargetPost).mockResolvedValue({
        id: "post-1",
        title: "Spammy Post",
      } as unknown as TargetPost);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue(null);
      vi.mocked(reportRepo.createReport).mockResolvedValue({
        id: "report-101",
        reason: "SPAM",
        remarks: "Contains commercial links",
        status: "PENDING",
        reporterId: validReporterId,
        postId: "post-1",
      } as unknown as CreatedReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "SPAM",
        remarks: "Contains commercial links",
        postId: "post-1",
      });

      expect(result).toEqual({
        success: true,
        message:
          "Thank you. Your report has been submitted for moderator review.",
        data: { id: "report-101" },
      });
      expect(reportRepo.createReport).toHaveBeenCalledWith({
        reporterId: validReporterId,
        reason: "SPAM",
        remarks: "Contains commercial links",
        postId: "post-1",
        commentId: undefined,
        announcementId: undefined,
      });
    });

    it("successfully creates a report on a comment without remarks", async () => {
      vi.mocked(reportRepo.findTargetComment).mockResolvedValue({
        id: "comment-1",
        content: "Abusive comment",
        isDeleted: false,
      } as unknown as TargetComment);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue(null);
      vi.mocked(reportRepo.createReport).mockResolvedValue({
        id: "report-102",
        reason: "HARASSMENT",
        remarks: null,
        status: "PENDING",
        reporterId: validReporterId,
        commentId: "comment-1",
      } as unknown as CreatedReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "HARASSMENT",
        commentId: "comment-1",
      });

      expect(result).toEqual({
        success: true,
        message:
          "Thank you. Your report has been submitted for moderator review.",
        data: { id: "report-102" },
      });
      expect(reportRepo.createReport).toHaveBeenCalledWith({
        reporterId: validReporterId,
        reason: "HARASSMENT",
        remarks: undefined,
        postId: undefined,
        commentId: "comment-1",
        announcementId: undefined,
      });
    });

    it("successfully creates a report on an announcement", async () => {
      vi.mocked(reportRepo.findTargetAnnouncement).mockResolvedValue({
        id: "ann-1",
        title: "Misleading announcement",
      } as unknown as TargetAnnouncement);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue(null);
      vi.mocked(reportRepo.createReport).mockResolvedValue({
        id: "report-103",
        reason: "FALSE_INFORMATION",
        remarks: "The dates are wrong",
        status: "PENDING",
        reporterId: validReporterId,
        announcementId: "ann-1",
      } as unknown as CreatedReport);

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "FALSE_INFORMATION",
        remarks: "The dates are wrong",
        announcementId: "ann-1",
      });

      expect(result).toEqual({
        success: true,
        message:
          "Thank you. Your report has been submitted for moderator review.",
        data: { id: "report-103" },
      });
    });

    it("handles database exceptions gracefully during creation", async () => {
      vi.mocked(reportRepo.findTargetPost).mockResolvedValue({
        id: "post-1",
        title: "Post",
      } as unknown as TargetPost);
      vi.mocked(reportRepo.findExistingReport).mockResolvedValue(null);
      vi.mocked(reportRepo.createReport).mockRejectedValue(
        new Error("DB error"),
      );

      const result = await submitReport({
        reporterId: validReporterId,
        reason: "OTHER",
        postId: "post-1",
      });

      expect(result).toEqual({
        message: "Failed to submit report. Please try again.",
      });
    });
  });

  describe("listModerationReports", () => {
    it("denies access for unauthorized user roles", async () => {
      const result = await listModerationReports("STUDENT");

      expect(result).toEqual({
        message: "You do not have permission to view moderation reports.",
      });
      expect(reportRepo.listReports).not.toHaveBeenCalled();
    });

    it("allows MODERATOR to fetch report queue", async () => {
      const mockReports = [
        {
          id: "rep-1",
          reason: "SPAM" as ReportReason,
          remarks: null,
          status: "PENDING" as ReportStatus,
          reporterId: "u-1",
          postId: "p-1",
          commentId: null,
          announcementId: null,
          reviewedById: null,
          reviewNotes: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reporter: {
            id: "u-1",
            name: "John",
            email: "john@ju.edu",
            role: "STUDENT" as UserRole,
          },
        },
      ];
      vi.mocked(reportRepo.listReports).mockResolvedValue(
        mockReports as unknown as ReportList,
      );

      const result = await listModerationReports("MODERATOR", {
        status: "PENDING",
      });

      expect(result).toEqual({
        success: true,
        data: mockReports,
      });
      expect(reportRepo.listReports).toHaveBeenCalledWith({
        status: "PENDING",
      });
    });

    it("allows ADMIN and SYSTEM_ADMIN to fetch reports", async () => {
      vi.mocked(reportRepo.listReports).mockResolvedValue(
        [] as unknown as ReportList,
      );

      const adminResult = await listModerationReports("ADMIN");
      expect(adminResult).toEqual({ success: true, data: [] });

      const sysAdminResult = await listModerationReports("SYSTEM_ADMIN");
      expect(sysAdminResult).toEqual({ success: true, data: [] });
    });
  });

  describe("getReportDetails", () => {
    it("denies access to non-moderator roles", async () => {
      const result = await getReportDetails("STUDENT", "rep-1");
      expect(result).toEqual({
        message: "You do not have permission to view this report.",
      });
      expect(reportRepo.findReportById).not.toHaveBeenCalled();
    });

    it("returns error if report does not exist", async () => {
      vi.mocked(reportRepo.findReportById).mockResolvedValue(null);

      const result = await getReportDetails("MODERATOR", "missing-id");
      expect(result).toEqual({ message: "Report not found." });
    });

    it("returns report details for authorized moderator", async () => {
      const mockReport = {
        id: "rep-1",
        reason: "SPAM" as ReportReason,
        status: "PENDING" as ReportStatus,
      };
      vi.mocked(reportRepo.findReportById).mockResolvedValue(
        mockReport as unknown as ReportDetail,
      );

      const result = await getReportDetails("MODERATOR", "rep-1");
      expect(result).toEqual({ success: true, data: mockReport });
    });
  });

  describe("dismissReport", () => {
    it("denies access to unauthorized roles", async () => {
      const result = await dismissReport({
        reportId: "rep-1",
        reviewerId: "user-1",
        reviewerRole: "FACULTY",
      });

      expect(result).toEqual({
        message: "You do not have permission to review reports.",
      });
      expect(reportRepo.updateReportStatus).not.toHaveBeenCalled();
    });

    it("returns error if report is not found", async () => {
      vi.mocked(reportRepo.findReportById).mockResolvedValue(null);

      const result = await dismissReport({
        reportId: "rep-missing",
        reviewerId: "mod-1",
        reviewerRole: "MODERATOR",
      });

      expect(result).toEqual({ message: "Report not found." });
      expect(reportRepo.updateReportStatus).not.toHaveBeenCalled();
    });

    it("successfully dismisses report with reviewer info", async () => {
      vi.mocked(reportRepo.findReportById).mockResolvedValue({
        id: "rep-1",
        status: "PENDING",
      } as unknown as ReportDetail);
      vi.mocked(reportRepo.updateReportStatus).mockResolvedValue({
        id: "rep-1",
        status: "DISMISSED",
      } as unknown as UpdatedReport);

      const result = await dismissReport({
        reportId: "rep-1",
        reviewerId: "mod-1",
        reviewerRole: "MODERATOR",
        reviewNotes: "Unfounded allegation.",
      });

      expect(result).toEqual({
        success: true,
        message: "Report has been dismissed.",
        data: { id: "rep-1" },
      });
      expect(reportRepo.updateReportStatus).toHaveBeenCalledWith({
        id: "rep-1",
        status: "DISMISSED",
        reviewedById: "mod-1",
        reviewNotes: "Unfounded allegation.",
      });
    });
  });

  describe("resolveReport", () => {
    it("denies access to unauthorized roles", async () => {
      const result = await resolveReport({
        reportId: "rep-1",
        reviewerId: "user-1",
        reviewerRole: "STAFF",
      });

      expect(result).toEqual({
        message: "You do not have permission to review reports.",
      });
      expect(reportRepo.updateReportStatus).not.toHaveBeenCalled();
    });

    it("returns error if report is not found", async () => {
      vi.mocked(reportRepo.findReportById).mockResolvedValue(null);

      const result = await resolveReport({
        reportId: "rep-missing",
        reviewerId: "admin-1",
        reviewerRole: "ADMIN",
      });

      expect(result).toEqual({ message: "Report not found." });
      expect(reportRepo.updateReportStatus).not.toHaveBeenCalled();
    });

    it("successfully resolves report with reviewer info", async () => {
      vi.mocked(reportRepo.findReportById).mockResolvedValue({
        id: "rep-1",
        status: "PENDING",
      } as unknown as ReportDetail);
      vi.mocked(reportRepo.updateReportStatus).mockResolvedValue({
        id: "rep-1",
        status: "RESOLVED",
      } as unknown as UpdatedReport);

      const result = await resolveReport({
        reportId: "rep-1",
        reviewerId: "admin-1",
        reviewerRole: "ADMIN",
        reviewNotes: "Content hidden and user warned.",
      });

      expect(result).toEqual({
        success: true,
        message: "Report has been resolved.",
        data: { id: "rep-1" },
      });
      expect(reportRepo.updateReportStatus).toHaveBeenCalledWith({
        id: "rep-1",
        status: "RESOLVED",
        reviewedById: "admin-1",
        reviewNotes: "Content hidden and user warned.",
      });
    });
  });
});
