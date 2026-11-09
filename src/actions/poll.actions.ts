"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as pollService from "@/services/poll.service";
import type { ActionResult } from "@/types/result";

/**
 * Creates a new poll request from untrusted form data.
 *
 * @param _ - Previous action state (unused).
 * @param formData - Form data containing question, description, options, subforumId, and closing date.
 * @returns An ActionResult or redirects upon successful submission.
 */
export async function createPollRequestAction(
  _: ActionResult<{ id: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }> | undefined> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { message: "You must be logged in to submit a poll request." };
  }

  const rawOptions = formData.getAll("options").map(String);
  let options = rawOptions.map((o) => o.trim()).filter((o) => o.length > 0);

  // If options were submitted as a single multiline string
  if (options.length <= 1) {
    const optionsText = String(formData.get("optionsText") || "");
    if (optionsText) {
      options = optionsText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  const subforumId =
    String(formData.get("subforumId") || "").trim() || undefined;
  const expiresAt = String(formData.get("expiresAt") || "").trim() || undefined;

  const result = await pollService.createPollRequest({
    question: String(formData.get("question") || ""),
    description: String(formData.get("description") || ""),
    options,
    subforumId,
    expiresAt,
    authorId: user.id,
  });

  if (result.success) {
    redirect("/polls?submitted=true");
  }
  return result;
}

/**
 * Casts a vote on a poll option for the current authenticated user.
 *
 * @param formData - Form data containing the poll ID and chosen option ID.
 */
export async function votePollAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;

  const pollId = String(formData.get("pollId") || "");
  const optionId = String(formData.get("optionId") || "");
  if (!pollId || !optionId) return;

  const result = await pollService.voteInPoll({
    pollId,
    optionId,
    userId: user.id,
  });

  if (result.success) {
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
  }
}

/**
 * Closes an active poll before its expiration date.
 *
 * @param formData - Form data containing pollId.
 */
export async function closePollAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;

  const pollId = String(formData.get("pollId") || "");
  if (!pollId) return;

  const result = await pollService.closePoll({
    pollId,
    userId: user.id,
    userRole: user.role,
  });

  if (result.success) {
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
  }
}

/**
 * Approves a pending poll request, publishing it publicly.
 *
 * @param formData - Form data containing pollId.
 */
export async function approvePollRequestAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;

  const pollId = String(formData.get("pollId") || "");
  if (!pollId) return;

  const result = await pollService.approvePollRequest({
    pollId,
    reviewerId: user.id,
    reviewerRole: user.role,
  });

  if (result.success) {
    revalidatePath("/polls");
    revalidatePath("/polls/pending");
  }
}

/**
 * Rejects and removes a pending poll request.
 *
 * @param formData - Form data containing pollId.
 */
export async function rejectPollRequestAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return;

  const pollId = String(formData.get("pollId") || "");
  if (!pollId) return;

  const result = await pollService.rejectPollRequest({
    pollId,
    reviewerId: user.id,
    reviewerRole: user.role,
  });

  if (result.success) {
    revalidatePath("/polls");
    revalidatePath("/polls/pending");
  }
}
