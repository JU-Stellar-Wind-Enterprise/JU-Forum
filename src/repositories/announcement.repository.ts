import type { PriorityLevel, TargetAudience } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Creates an announcement for an authorized author. */
export const createAnnouncement = (data: {
  title: string;
  content: string;
  priority: PriorityLevel;
  targetAudience: TargetAudience;
  expiresAt: Date | null;
  authorId: string;
}) => prisma.announcement.create({ data });

/** Finds one active announcement by ID. */
export const findAnnouncementById = (id: string) =>
  prisma.announcement.findFirst({
    where: { id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

/** Lists active announcements for a target audience. */
export const listAnnouncements = (audiences: TargetAudience[]) =>
  prisma.announcement.findMany({
    where: {
      targetAudience: { in: audiences },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });