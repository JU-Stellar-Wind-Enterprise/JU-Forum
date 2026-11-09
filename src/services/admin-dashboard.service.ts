import type { AccountStatus, UserRole } from "@/generated/prisma/client";
import * as adminRepo from "@/repositories/admin-dashboard.repository";
import type { ActionResult } from "@/types/result";

const adminRoles: UserRole[] = ["ADMIN", "SYSTEM_ADMIN"];

/**
 * Checks whether the given role has administrative access permissions.
 *
 * @param role - The user's role.
 * @returns True if the user is an ADMIN or SYSTEM_ADMIN.
 */
export function canAccessAdminDashboard(role: UserRole): boolean {
  return adminRoles.includes(role);
}

const UNAUTHORIZED_WARNING =
  "Unauthorized access warning: administrative privileges required.";

/**
 * Retrieves real-time platform statistics for the administrator dashboard.
 *
 * @param actorRole - The caller's role.
 * @returns Counts of users, subforums, posts, and pending reports.
 */
export async function getPlatformStats(actorRole: UserRole): Promise<
  ActionResult<{
    totalUsers: number;
    activeSubforums: number;
    publishedDiscussions: number;
    pendingReports: number;
  }>
> {
  if (!canAccessAdminDashboard(actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const stats = await adminRepo.countPlatformStats();
  return { success: true, data: stats };
}

/**
 * Fetches users with search and filter capabilities.
 *
 * @param input - The caller's role, plus optional search keyword and filters.
 * @returns The list of matching users.
 */
export async function getUsers(input: {
  actorRole: UserRole;
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: AccountStatus;
      appliedForModerator: boolean;
      createdAt: Date;
    }>
  >
> {
  if (!canAccessAdminDashboard(input.actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const users = await adminRepo.findUsers({
    search: input.search,
    role: input.role,
    status: input.status,
  });

  return { success: true, data: users };
}

/**
 * Updates a target user's account status (e.g. ACTIVE, SUSPENDED, REJECTED).
 *
 * @param input - Actor and target user details, and desired status.
 * @returns ActionResult with the updated user or error details.
 */
export async function updateUserStatus(input: {
  actorId: string;
  actorRole: UserRole;
  targetUserId: string;
  newStatus: AccountStatus;
}): Promise<ActionResult<{ id: string; status: AccountStatus }>> {
  if (!canAccessAdminDashboard(input.actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  // Prevent administrators from suspending their own accounts
  if (input.actorId === input.targetUserId && input.newStatus === "SUSPENDED") {
    return { message: "You cannot suspend your own account." };
  }

  const target = await adminRepo.findUserById(input.targetUserId);
  if (!target) {
    return { message: "User not found." };
  }

  // Protect top-level administrator permissions: only SYSTEM_ADMIN can modify other administrators
  if (
    (target.role === "ADMIN" || target.role === "SYSTEM_ADMIN") &&
    input.actorRole !== "SYSTEM_ADMIN"
  ) {
    return {
      message: "Cannot modify another top-level administrator's permissions.",
    };
  }

  try {
    const updated = await adminRepo.updateUserStatus(
      input.targetUserId,
      input.newStatus,
    );
    return {
      success: true,
      message: "User status updated successfully.",
      data: { id: updated.id, status: updated.status },
    };
  } catch {
    return {
      message: "Unable to update user status. Please try again.",
    };
  }
}

/**
 * Retrieves all pending moderator applications.
 *
 * @param actorRole - The caller's role.
 * @returns List of users with pending moderator applications.
 */
export async function getPendingModeratorApplications(
  actorRole: UserRole,
): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      appliedForModerator: boolean;
      createdAt: Date;
    }>
  >
> {
  if (!canAccessAdminDashboard(actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const applications = await adminRepo.findPendingModeratorApplications();
  return { success: true, data: applications };
}

/**
 * Grants moderator privileges to a user and clears the pending application flag.
 *
 * @param input - The caller's role and target user ID.
 * @returns ActionResult indicating success or failure.
 */
export async function grantModeratorPrivileges(input: {
  actorRole: UserRole;
  targetUserId: string;
}): Promise<ActionResult> {
  if (!canAccessAdminDashboard(input.actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const target = await adminRepo.findUserById(input.targetUserId);
  if (!target) {
    return { message: "User not found." };
  }

  await adminRepo.setUserRole(input.targetUserId, "MODERATOR", false);
  return {
    success: true,
    message: "Moderator privileges granted successfully.",
  };
}

/**
 * Revokes moderator privileges from a user and resets role to STUDENT (or provided role).
 *
 * @param input - The caller's role, target user ID, and optional base role.
 * @returns ActionResult indicating success or failure.
 */
export async function revokeModeratorPrivileges(input: {
  actorRole: UserRole;
  targetUserId: string;
  newRole?: UserRole;
}): Promise<ActionResult> {
  if (!canAccessAdminDashboard(input.actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const target = await adminRepo.findUserById(input.targetUserId);
  if (!target) {
    return { message: "User not found." };
  }

  await adminRepo.setUserRole(
    input.targetUserId,
    input.newRole ?? "STUDENT",
    false,
  );
  return {
    success: true,
    message: "Moderator privileges revoked successfully.",
  };
}

/**
 * Publishes a platform-wide alert notice visible across all user feeds.
 *
 * @param input - Title, content, author ID, author role, and optional expiry date.
 * @returns ActionResult with the created announcement ID.
 */
export async function publishAlertNotice(input: {
  actorId: string;
  actorRole: UserRole;
  title: string;
  content: string;
  expiresAt?: string;
}): Promise<ActionResult<{ id: string }>> {
  if (!canAccessAdminDashboard(input.actorRole)) {
    return { message: UNAUTHORIZED_WARNING };
  }

  const title = input.title?.trim();
  const content = input.content?.trim();

  if (!title || !content) {
    return { message: "Title and content are required for alert notice." };
  }

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  const alert = await adminRepo.createPlatformAlert({
    title,
    content,
    priority: "URGENT",
    targetAudience: "ALL",
    authorId: input.actorId,
    expiresAt,
  });

  return {
    success: true,
    data: { id: alert.id },
    message: "Platform-wide alert notice published.",
  };
}
