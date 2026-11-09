"use server";

import { revalidatePath } from "next/cache";
import type { AccountStatus, UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import {
  grantModeratorPrivileges,
  publishAlertNotice,
  revokeModeratorPrivileges,
  updateUserStatus,
} from "@/services/admin-dashboard.service";
import type { ActionResult } from "@/types/result";

/**
 * Server action to update user account status (e.g. ACTIVE, SUSPENDED, REJECTED).
 */
export async function updateUserStatusAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: AccountStatus }>> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Unauthorized access warning: administrative privileges required.",
    };
  }

  const targetUserId = String(formData.get("targetUserId") || "");
  const newStatus = String(formData.get("newStatus") || "") as AccountStatus;

  if (!targetUserId || !newStatus) {
    return { message: "Target user and new status are required." };
  }

  const result = await updateUserStatus({
    actorId: user.id,
    actorRole: user.role,
    targetUserId,
    newStatus,
  });

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin-dashboard");
  }

  return result;
}

/**
 * Server action to grant moderator privileges to a user.
 */
export async function grantModeratorPrivilegesAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Unauthorized access warning: administrative privileges required.",
    };
  }

  const targetUserId = String(formData.get("targetUserId") || "");
  if (!targetUserId) {
    return { message: "Target user ID is required." };
  }

  const result = await grantModeratorPrivileges({
    actorRole: user.role,
    targetUserId,
  });

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin-dashboard");
  }

  return result;
}

/**
 * Server action to revoke moderator privileges from a user.
 */
export async function revokeModeratorPrivilegesAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Unauthorized access warning: administrative privileges required.",
    };
  }

  const targetUserId = String(formData.get("targetUserId") || "");
  const newRole = (String(formData.get("newRole") || "") || undefined) as
    | UserRole
    | undefined;

  if (!targetUserId) {
    return { message: "Target user ID is required." };
  }

  const result = await revokeModeratorPrivileges({
    actorRole: user.role,
    targetUserId,
    newRole,
  });

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin-dashboard");
  }

  return result;
}

/**
 * Server action to publish a platform-wide alert notice.
 */
export async function publishAlertNoticeAction(
  _: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Unauthorized access warning: administrative privileges required.",
    };
  }

  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const expiresAt = String(formData.get("expiresAt") || "") || undefined;

  const result = await publishAlertNotice({
    actorId: user.id,
    actorRole: user.role,
    title,
    content,
    expiresAt,
  });

  if (result.success) {
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin-dashboard");
  }

  return result;
}
