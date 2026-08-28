import * as subforums from "@/repositories/subforum.repository";
import type { ActionResult } from "@/types/result";

/** Creates an auto-approved subforum for an authenticated user. */
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

/** Lists subforums available for browsing and post creation. */
export const listSubforums = () => subforums.listSubforums();
