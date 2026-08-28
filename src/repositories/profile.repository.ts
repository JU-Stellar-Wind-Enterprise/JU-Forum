import { prisma } from "@/lib/prisma";

/** Finds a non-deleted user's public profile fields. */
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
