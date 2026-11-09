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
      interests: true,
      status: true,
      createdAt: true,
    },
  });

/**
 * Finds a user by unique ID for internal business logic and validation checks.
 *
 * @param id - The unique ID of the user.
 * @returns The user record or null if not found.
 */
export const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
  });

/**
 * Finds a user by nickname (case-insensitive) to verify uniqueness across the platform.
 *
 * @param nickname - The nickname to search.
 * @returns The user record or null if not found.
 */
export const findUserByNickname = (nickname: string) =>
  prisma.user.findFirst({
    where: {
      nickname: {
        equals: nickname,
        mode: "insensitive",
      },
      isDeleted: false,
    },
  });

/**
 * Updates a user's editable profile information.
 *
 * @param id - The unique ID of the user.
 * @param data - The profile fields to update.
 * @returns The updated user record.
 */
export const updateUserProfile = (
  id: string,
  data: {
    nickname?: string | null;
    profilePictureUrl?: string | null;
    aboutMe?: string | null;
    interests?: string[];
    nicknameLastChanged?: Date;
  },
) =>
  prisma.user.update({
    where: { id },
    data,
  });
