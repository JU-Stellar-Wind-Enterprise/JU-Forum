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

/** Checks whether a role may publish announcements. */
export const canCreateAnnouncement = (role: UserRole) =>
  creators.includes(role);

/** Creates a validated announcement for an authorized role. */
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

/** Lists active announcements visible to a user's role. */
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

/** Retrieves an active announcement by ID. */
export const findAnnouncementById = (id: string) =>
  announcements.findAnnouncementById(id);