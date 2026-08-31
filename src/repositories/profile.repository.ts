import { prisma } from "@/lib/prisma";

/**
 * Finds the public profile fields of an active, non-deleted user.
 *
 * @param id - The unique ID of the profile owner.
 * @returns The safe public profile projection, or `null` when unavailable.
 * @throws If the database query fails.
 */
export const findPublicProfile = (id: string) =>
  prisma.user.findFirst({
    where: { id, isDeleted: false, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      batch: true,
      nickname: true,
      profilePictureUrl: true,
      aboutMe: true,
      status: true,
      createdAt: true,
    },
  });
