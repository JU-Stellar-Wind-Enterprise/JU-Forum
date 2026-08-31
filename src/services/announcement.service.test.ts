import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Announcement,
  PriorityLevel,
  TargetAudience,
  UserRole,
} from "@/generated/prisma/client";
import * as announcementRepo from "@/repositories/announcement.repository";
import {
  canCreateAnnouncement,
  createAnnouncement,
  findAnnouncementById,
  listAnnouncements,
} from "./announcement.service";

type AnnouncementRecord = Announcement & {
  author: { id: string; name: string; role: UserRole };
};

vi.mock("@/repositories/announcement.repository", () => ({
  createAnnouncement: vi.fn(),
  listAnnouncements: vi.fn(),
  findAnnouncementById: vi.fn(),
}));

describe("announcement.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canCreateAnnouncement", () => {
    it("returns true for authorized roles", () => {
      const allowedRoles: UserRole[] = [
        "FACULTY",
        "STAFF",
        "MODERATOR",
        "ADMIN",
        "SYSTEM_ADMIN",
      ];
      for (const role of allowedRoles) {
        expect(canCreateAnnouncement(role)).toBe(true);
      }
    });

    it("returns false for unauthorized roles", () => {
      expect(canCreateAnnouncement("STUDENT" as UserRole)).toBe(false);
    });
  });

  describe("createAnnouncement", () => {
    it("returns error if author role cannot create announcements", async () => {
      const res = await createAnnouncement({
        title: "Campus Update",
        content: "New semester starts next week.",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "student-1",
        authorRole: "STUDENT",
      });

      expect(res).toEqual({
        message: "You do not have permission to create announcements.",
      });
      expect(announcementRepo.createAnnouncement).not.toHaveBeenCalled();
    });

    it("returns error if title or content is empty or whitespace", async () => {
      const res1 = await createAnnouncement({
        title: "",
        content: "Valid content",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });
      expect(res1).toEqual({ message: "Title and content are required." });

      const res2 = await createAnnouncement({
        title: "   ",
        content: "Valid content",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });
      expect(res2).toEqual({ message: "Title and content are required." });

      const res3 = await createAnnouncement({
        title: "Valid Title",
        content: "   ",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });
      expect(res3).toEqual({ message: "Title and content are required." });
    });

    it("returns error if priority or targetAudience is invalid", async () => {
      const res1 = await createAnnouncement({
        title: "Title",
        content: "Content",
        priority: "SUPER_URGENT",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });
      expect(res1).toEqual({
        message: "Invalid priority or target audience.",
      });

      const res2 = await createAnnouncement({
        title: "Title",
        content: "Content",
        priority: "HIGH",
        targetAudience: "INVALID_AUDIENCE",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });
      expect(res2).toEqual({
        message: "Invalid priority or target audience.",
      });
    });

    it("returns error if expiresAt is an invalid date string", async () => {
      const res = await createAnnouncement({
        title: "Title",
        content: "Content",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "invalid-date-format",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(res).toEqual({ message: "Expiration must be a future date." });
    });

    it("returns error if expiresAt is in the past", async () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      const res = await createAnnouncement({
        title: "Title",
        content: "Content",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: pastDate,
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(res).toEqual({ message: "Expiration must be a future date." });
    });

    it("successfully creates announcement without expiration date", async () => {
      vi.mocked(announcementRepo.createAnnouncement).mockResolvedValue({
        id: "ann-101",
        title: "Holiday Notice",
        content: "University closed tomorrow",
        priority: "HIGH" as PriorityLevel,
        targetAudience: "ALL" as TargetAudience,
        expiresAt: null,
        authorId: "faculty-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createAnnouncement({
        title: "  Holiday Notice  ",
        content: "  University closed tomorrow  ",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(announcementRepo.createAnnouncement).toHaveBeenCalledWith({
        title: "Holiday Notice",
        content: "University closed tomorrow",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: null,
        authorId: "faculty-1",
      });
      expect(res).toEqual({ success: true, data: { id: "ann-101" } });
    });

    it("successfully creates announcement with a future expiration date", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      vi.mocked(announcementRepo.createAnnouncement).mockResolvedValue({
        id: "ann-102",
        title: "Exam Schedule",
        content: "Exam routine published",
        priority: "MEDIUM" as PriorityLevel,
        targetAudience: "STUDENTS" as TargetAudience,
        expiresAt: futureDate,
        authorId: "faculty-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createAnnouncement({
        title: "Exam Schedule",
        content: "Exam routine published",
        priority: "MEDIUM",
        targetAudience: "STUDENTS",
        expiresAt: futureDate.toISOString(),
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(announcementRepo.createAnnouncement).toHaveBeenCalledWith({
        title: "Exam Schedule",
        content: "Exam routine published",
        priority: "MEDIUM",
        targetAudience: "STUDENTS",
        expiresAt: futureDate,
        authorId: "faculty-1",
      });
      expect(res).toEqual({ success: true, data: { id: "ann-102" } });
    });
  });

  describe("listAnnouncements", () => {
    it("fetches announcements for STUDENT role with ALL and STUDENTS audiences", async () => {
      const mockList = [{ id: "ann-1", title: "Notice" }];
      vi.mocked(announcementRepo.listAnnouncements).mockResolvedValue(
        mockList as unknown as AnnouncementRecord[],
      );

      const res = await listAnnouncements("STUDENT");

      expect(announcementRepo.listAnnouncements).toHaveBeenCalledWith([
        "ALL",
        "STUDENTS",
      ]);
      expect(res).toEqual(mockList);
    });

    it("fetches announcements for FACULTY role with ALL and FACULTY audiences", async () => {
      const mockList = [{ id: "ann-2", title: "Faculty Notice" }];
      vi.mocked(announcementRepo.listAnnouncements).mockResolvedValue(
        mockList as unknown as AnnouncementRecord[],
      );

      const res = await listAnnouncements("FACULTY");

      expect(announcementRepo.listAnnouncements).toHaveBeenCalledWith([
        "ALL",
        "FACULTY",
      ]);
      expect(res).toEqual(mockList);
    });

    it("fetches announcements for STAFF role with ALL and STAFF audiences", async () => {
      const mockList = [{ id: "ann-3", title: "Staff Notice" }];
      vi.mocked(announcementRepo.listAnnouncements).mockResolvedValue(
        mockList as unknown as AnnouncementRecord[],
      );

      const res = await listAnnouncements("STAFF");

      expect(announcementRepo.listAnnouncements).toHaveBeenCalledWith([
        "ALL",
        "STAFF",
      ]);
      expect(res).toEqual(mockList);
    });

    it("fetches announcements for other roles with ALL audience", async () => {
      const mockList = [{ id: "ann-4", title: "General Notice" }];
      vi.mocked(announcementRepo.listAnnouncements).mockResolvedValue(
        mockList as unknown as AnnouncementRecord[],
      );

      const res = await listAnnouncements("ADMIN");

      expect(announcementRepo.listAnnouncements).toHaveBeenCalledWith(["ALL"]);
      expect(res).toEqual(mockList);
    });
  });

  describe("findAnnouncementById", () => {
    it("delegates to repository and returns matching announcement", async () => {
      const mockAnnouncement = {
        id: "ann-1",
        title: "Found Announcement",
        content: "Details",
      };
      vi.mocked(announcementRepo.findAnnouncementById).mockResolvedValue(
        mockAnnouncement as unknown as AnnouncementRecord,
      );

      const result = await findAnnouncementById("ann-1");

      expect(announcementRepo.findAnnouncementById).toHaveBeenCalledWith(
        "ann-1",
      );
      expect(result).toEqual(mockAnnouncement);
    });
  });
});