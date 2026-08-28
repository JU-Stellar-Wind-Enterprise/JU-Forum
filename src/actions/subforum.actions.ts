"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as subforumService from "@/services/subforum.service";
import type { ActionResult } from "@/types/result";

/** Creates a subforum from form data for the current authenticated user. */
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
