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
