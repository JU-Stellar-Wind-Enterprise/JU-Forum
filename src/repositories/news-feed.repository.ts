import type { TargetAudience } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Retrieves the IDs of all subforums followed by a user.
 *
 * @param userId - The authenticated user's ID.
 * @returns An array of followed subforum IDs.
 * @throws If the database query fails.
 */
export async function findFollowedSubforumIds(
  userId: string,
): Promise<string[]> {
  const follows = await prisma.subforumFollow.findMany({
    where: { userId },
    select: { subforumId: true },
  });
  return follows.map((entry) => entry.subforumId);
}

/**
 * Lists active, non-archived posts belonging to approved subforums for feed aggregation.
 *
 * @param subforumIds - Optional list of subforum IDs to restrict results to.
 * @returns Active post records with public author, subforum, vote, and comment count data.
 * @throws If the database query fails.
 */
export const listActiveFeedPosts = (subforumIds?: string[]) =>
  prisma.post.findMany({
    where: {
      isArchived: false,
      subforum: { isApproved: true },
      ...(subforumIds ? { subforumId: { in: subforumIds } } : {}),
    },
    select: {
      id: true,
      title: true,
      content: true,
      isLocked: true,
      isArchived: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          isDeleted: true,
        },
      },
      subforum: {
        select: {
          id: true,
          name: true,
          isApproved: true,
        },
      },
      votes: {
        select: {
          userId: true,
          type: true,
        },
      },
      _count: {
        select: {
          comments: {
            where: { isDeleted: false },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

/**
 * Lists active, unexpired announcements targeted to one or more audiences.
 *
 * @param audiences - The audience scopes visible to the viewer's role.
 * @returns Active announcement records with public author details.
 * @throws If the database query fails.
 */
export const listActiveFeedAnnouncements = (audiences: TargetAudience[]) =>
  prisma.announcement.findMany({
    where: {
      targetAudience: { in: audiences },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      targetAudience: true,
      expiresAt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
