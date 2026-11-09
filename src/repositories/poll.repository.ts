import { prisma } from "@/lib/prisma";

export interface CreatePollInput {
  question: string;
  description?: string | null;
  expiresAt?: Date | null;
  authorId: string;
  subforumId?: string | null;
  postId?: string | null;
  isApproved?: boolean;
  options: string[];
}

/**
 * Creates a poll with nested options in the database.
 *
 * @param input - The poll metadata, author ID, target discussion space, and option labels.
 * @returns The newly created poll including its generated options.
 * @throws If a database constraint is violated.
 */
export async function createPoll(input: CreatePollInput) {
  const { options, ...pollData } = input;
  return prisma.poll.create({
    data: {
      ...pollData,
      options: {
        create: options.map((text) => ({ text })),
      },
    },
    include: {
      options: true,
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });
}

/**
 * Finds a poll by its unique ID, including options and votes.
 *
 * @param id - The unique ID of the poll.
 * @returns The matching poll or null if not found.
 */
export async function findPollById(id: string) {
  return prisma.poll.findUnique({
    where: { id },
    include: {
      options: true,
      votes: true,
      author: {
        select: { id: true, name: true, role: true },
      },
      subforum: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Updates poll fields, such as approval status or closed state.
 *
 * @param id - The unique ID of the poll to update.
 * @param data - The partial fields to update.
 * @returns The updated poll record.
 */
export async function updatePoll(
  id: string,
  data: {
    isApproved?: boolean;
    isClosed?: boolean;
    question?: string;
    description?: string | null;
  },
) {
  return prisma.poll.update({
    where: { id },
    data,
  });
}

/**
 * Deletes a poll by its unique ID.
 *
 * @param id - The unique ID of the poll to delete.
 * @returns The deleted poll record.
 */
export async function deletePoll(id: string) {
  return prisma.poll.delete({
    where: { id },
  });
}

/**
 * Creates a vote record for a specific option in a poll.
 *
 * @param data - User ID, Poll ID, and Option ID.
 * @returns The created poll vote record.
 */
export async function createPollVote(data: {
  userId: string;
  pollId: string;
  optionId: string;
}) {
  return prisma.pollVote.create({
    data,
  });
}

/**
 * Finds an existing vote cast by a specific user on a poll.
 *
 * @param userId - The ID of the voter.
 * @param pollId - The ID of the poll.
 * @returns The existing vote record or null.
 */
export async function findUserPollVote(userId: string, pollId: string) {
  return prisma.pollVote.findUnique({
    where: {
      userId_pollId: {
        userId,
        pollId,
      },
    },
  });
}

/**
 * Lists approved active/closed polls.
 *
 * @param subforumId - Optional subforum filter.
 * @returns Approved polls ordered from newest to oldest.
 */
export async function listApprovedPolls(subforumId?: string) {
  return prisma.poll.findMany({
    where: {
      isApproved: true,
      ...(subforumId ? { subforumId } : {}),
    },
    include: {
      options: true,
      author: {
        select: { id: true, name: true, role: true },
      },
      votes: true,
      subforum: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Lists pending poll requests awaiting moderator review.
 *
 * @param subforumId - Optional subforum filter.
 * @returns Pending unapproved polls ordered from oldest to newest.
 */
export async function listPendingPolls(subforumId?: string) {
  return prisma.poll.findMany({
    where: {
      isApproved: false,
      ...(subforumId ? { subforumId } : {}),
    },
    include: {
      options: true,
      author: {
        select: { id: true, name: true, role: true },
      },
      subforum: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Checks if a user is an assigned moderator of a given subforum.
 *
 * @param userId - The user ID to check.
 * @param subforumId - The subforum ID to check.
 * @returns True if assigned as moderator, false otherwise.
 */
export async function isUserSubforumModerator(
  userId: string,
  subforumId: string,
): Promise<boolean> {
  const mod = await prisma.subforumModerator.findUnique({
    where: {
      userId_subforumId: {
        userId,
        subforumId,
      },
    },
  });
  return !!mod;
}
