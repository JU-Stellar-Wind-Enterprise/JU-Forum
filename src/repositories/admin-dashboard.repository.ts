import type {
  AccountStatus,
  PriorityLevel,
  TargetAudience,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Aggregates real-time platform statistics for the administrator dashboard.
 *
 * @returns Counts for registered users, active subforums, published posts, and pending reports.
 */
export async function countPlatformStats() {
  const [totalUsers, activeSubforums, publishedDiscussions, pendingReports] =
    await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.subforum.count({ where: { isApproved: true } }),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

  return {
    totalUsers,
    activeSubforums,
    publishedDiscussions,
    pendingReports,
  };
}

/**
 * Retrieves a filtered list of users for administration oversight.
 *
 * @param filters - Optional search term, role filter, and status filter.
 * @returns List of users matching the search criteria.
 */
export async function findUsers(filters?: {
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
}) {
  const where: {
    isDeleted: boolean;
    role?: UserRole;
    status?: AccountStatus;
    OR?: Array<
      | { name: { contains: string; mode: "insensitive" } }
      | { email: { contains: string; mode: "insensitive" } }
    >;
  } = {
    isDeleted: false,
  };

  if (filters?.role) {
    where.role = filters.role;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      appliedForModerator: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves a user record by ID for administrative validation.
 *
 * @param id - The unique user ID.
 * @returns User record or null.
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      appliedForModerator: true,
    },
  });
}

/**
 * Updates an account's status.
 *
 * @param id - The target user ID.
 * @param status - The new account status.
 * @returns The updated user.
 */
export async function updateUserStatus(id: string, status: AccountStatus) {
  return prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
}

/**
 * Finds all pending moderator applications.
 *
 * @returns Users who have applied for moderator privileges.
 */
export async function findPendingModeratorApplications() {
  return prisma.user.findMany({
    where: {
      appliedForModerator: true,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      appliedForModerator: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Updates a user's role and moderator application status.
 *
 * @param id - The target user ID.
 * @param role - The new user role.
 * @param appliedForModerator - Whether the moderator application remains active.
 * @returns The updated user record.
 */
export async function setUserRole(
  id: string,
  role: UserRole,
  appliedForModerator = false,
) {
  return prisma.user.update({
    where: { id },
    data: {
      role,
      appliedForModerator,
    },
    select: {
      id: true,
      role: true,
      appliedForModerator: true,
    },
  });
}

/**
 * Creates a platform-wide alert notice as an announcement.
 *
 * @param data - The alert details including author ID and expiration.
 * @returns The created announcement record.
 */
export async function createPlatformAlert(data: {
  title: string;
  content: string;
  priority: PriorityLevel;
  targetAudience: TargetAudience;
  authorId: string;
  expiresAt?: Date | null;
}) {
  return prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetAudience: data.targetAudience,
      authorId: data.authorId,
      expiresAt: data.expiresAt ?? null,
    },
  });
}
