"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as subforumService from "@/services/subforum.service";
import type { ActionResult } from "@/types/result";

/**
 * Creates an auto-approved subforum for the current active user.
 *
 * @param _ - The previous action state supplied by React. It is unused.
 * @param formData - Form data containing the proposed name and description.
 * @returns A validation or authorization result when creation does not redirect.
 * @throws A Next.js redirect signal after the subforum is created successfully.
 */
export async function createSubforumAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE")
    return { message: "You must be logged in." };
  const result = await subforumService.createSubforum({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    ownerId: user.id,
  });
  if (result.success) redirect(`/subforum/${result.data?.id}`);
  return result;
}
