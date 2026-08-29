import type { PriorityLevel, TargetAudience } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Creates an announcement for an authorized author.
 *
 * @param data - The announcement content, audience, priority, expiry, and author ID.
 * @returns The newly created announcement record.
 * @throws If a related record is missing or the database write fails.
 */
export const createAnnouncement = (data: {
  title: string;
  content: string;
  priority: PriorityLevel;
  targetAudience: TargetAudience;
  expiresAt: Date | null;
  authorId: string;
}) => prisma.announcement.create({ data });

/**
 * Finds an unexpired announcement by its unique ID.
 *
 * @param id - The announcement ID to look up.
 * @returns The announcement with public author details, or `null`.
 * @throws If the database query fails.
 */
export const findAnnouncementById = (id: string) =>
  prisma.announcement.findFirst({
    where: { id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

/**
 * Lists unexpired announcements for one or more target audiences.
 *
 * @param audiences - The audience values the current viewer is allowed to see.
 * @returns Matching announcements ordered by priority and creation time.
 * @throws If the database query fails.
 */
export const listAnnouncements = (audiences: TargetAudience[]) =>
  prisma.announcement.findMany({
    where: {
      targetAudience: { in: audiences },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });