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
