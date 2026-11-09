import * as subforums from "@/repositories/subforum.repository";
import type { ActionResult } from "@/types/result";

/**
 * Validates and creates an auto-approved subforum for an authenticated user.
 *
 * @param input - The proposed name, description, and authenticated owner ID.
 * @returns A result containing the new subforum ID, or a validation error.
 * @throws If an unexpected repository or database operation fails.
 */
export async function createSubforum(input: {
  name: string;
  description: string;
  ownerId: string;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name || !description)
    return { message: "Name and description are required." };
  if (name.length > 80)
    return { message: "Name must be 80 characters or less." };
  if (description.length > 500)
    return { message: "Description must be 500 characters or less." };
  if (await subforums.findSubforumByName(name))
    return { message: "A subforum with this name already exists." };
  const created = await subforums.createSubforum({
    ...input,
    name,
    description,
  });
  return { success: true, data: { id: created.id } };
}

/**
 * Lists approved subforums available for browsing and post creation.
 *
 * @returns Approved subforums ordered from newest to oldest with owner details.
 * @throws If the database query fails.
 */
export const listSubforums = () => subforums.listSubforums();

/**
 * Checks whether a user is currently following a subforum.
 *
 * @param userId - The authenticated user's ID.
 * @param subforumId - The subforum's unique ID.
 * @returns `true` if the user follows the subforum; otherwise `false`.
 * @throws If the database query fails.
 */
export const isFollowingSubforum = (userId: string, subforumId: string) =>
  subforums.isUserFollowingSubforum(userId, subforumId);

/**
 * Toggles a user's follow subscription on an approved subforum.
 *
 * @param input - The authenticated user ID and target subforum ID.
 * @returns The resulting follow state, or a user-facing error message.
 * @throws If an unexpected repository or database operation fails.
 */
export async function toggleSubforumFollow(input: {
  userId: string;
  subforumId: string;
}): Promise<ActionResult<{ following: boolean }>> {
  const userId = input.userId.trim();
  if (!userId) return { message: "You must be logged in." };

  const subforum = await subforums.findSubforumById(input.subforumId);
  if (!subforum || !subforum.isApproved) {
    return { message: "Subforum not found." };
  }

  const alreadyFollowing = await subforums.isUserFollowingSubforum(
    userId,
    input.subforumId,
  );
  if (alreadyFollowing) {
    await subforums.unfollowSubforum(userId, input.subforumId);
    return { success: true, data: { following: false } };
  }

  await subforums.followSubforum(userId, input.subforumId);
  return { success: true, data: { following: true } };
}
