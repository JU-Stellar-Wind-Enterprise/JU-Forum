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