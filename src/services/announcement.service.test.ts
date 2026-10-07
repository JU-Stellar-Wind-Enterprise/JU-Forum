import { beforeEach, describe, expect, it, vi } from "vitest";
import * as announcementRepo from "@/repositories/announcement.repository";
import { canCreateAnnouncement, createAnnouncement } from "./announcement.service";

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
    it("returns true for faculty", () => {
      const result = canCreateAnnouncement("FACULTY");

      expect(result).toBe(true);
    });

    it("returns false for student", () => {
      const result = canCreateAnnouncement("STUDENT");

      expect(result).toBe(false);
    });
  });

  describe("createAnnouncement", () => {
    it("returns error when title is empty", async () => {
      const result = await createAnnouncement({
        title: "",
        content: "Valid content",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(result).toEqual({
        message: "Title and content are required.",
      });
    });

    it("creates an announcement successfully", async () => {
      vi.mocked(announcementRepo.createAnnouncement).mockResolvedValue({
        id: "ann-101",
        title: "Holiday Notice",
        content: "University closed tomorrow",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: null,
        authorId: "faculty-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createAnnouncement({
        title: "Holiday Notice",
        content: "University closed tomorrow",
        priority: "HIGH",
        targetAudience: "ALL",
        expiresAt: "",
        authorId: "faculty-1",
        authorRole: "FACULTY",
      });

      expect(result).toEqual({
        success: true,
        data: {
          id: "ann-101",
        },
      });
    });
  });
});