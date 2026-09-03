import type {
  PriorityLevel,
  TargetAudience,
  UserRole,
} from "@/generated/prisma/client";
import * as announcements from "@/repositories/announcement.repository";
import type { ActionResult } from "@/types/result";

const creators: UserRole[] = [
  "FACULTY",
  "STAFF",
  "MODERATOR",
  "ADMIN",
  "SYSTEM_ADMIN",
];
const priorities: PriorityLevel[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const audiences: TargetAudience[] = ["ALL", "STUDENTS", "FACULTY", "STAFF"];

/**
 * Checks whether a user role is allowed to publish announcements.
 *
 * @param role - The role whose announcement permission is being checked.
 * @returns `true` when the role may publish announcements; otherwise `false`.
 */
export const canCreateAnnouncement = (role: UserRole) =>
  creators.includes(role);

/**
 * Validates and creates an announcement for an authorized user role.
 *
 * @param input - Announcement fields plus the authenticated author's ID and role.
 * @returns A result containing the new announcement ID, or a user-facing error.
 * @throws If an unexpected repository or database operation fails.
 */
export async function createAnnouncement(input: {
  title: string;
  content: string;
  priority: string;
  targetAudience: string;
  expiresAt: string;
  authorId: string;
  authorRole: UserRole;
}): Promise<ActionResult<{ id: string }>> {
  if (!canCreateAnnouncement(input.authorRole))
    return { message: "You do not have permission to create announcements." };
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { message: "Title and content are required." };
  if (
    !priorities.includes(input.priority as PriorityLevel) ||
    !audiences.includes(input.targetAudience as TargetAudience)
  )
    return { message: "Invalid priority or target audience." };
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (
    expiresAt &&
    (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())
  )
    return { message: "Expiration must be a future date." };
  const created = await announcements.createAnnouncement({
    title,
    content,
    priority: input.priority as PriorityLevel,
    targetAudience: input.targetAudience as TargetAudience,
    expiresAt,
    authorId: input.authorId,
  });
  return { success: true, data: { id: created.id } };
}

/**
 * Lists unexpired announcements visible to a particular user role.
 *
 * @param role - The viewer's role, used to select permitted target audiences.
 * @returns Matching announcements ordered by priority and creation time.
 * @throws If the database query fails.
 */
export const listAnnouncements = (role: UserRole) =>
  announcements.listAnnouncements(
    role === "STUDENT"
      ? ["ALL", "STUDENTS"]
      : role === "FACULTY"
        ? ["ALL", "FACULTY"]
        : role === "STAFF"
          ? ["ALL", "STAFF"]
          : ["ALL"],
  );

/**
 * Retrieves an announcement only when it exists and has not expired.
 *
 * @param id - The unique ID of the announcement to retrieve.
 * @returns The active announcement with public author details, or `null`.
 * @throws If the database query fails.
 */
export const findAnnouncementById = (id: string) =>
  announcements.findAnnouncementById(id);