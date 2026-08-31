import { prisma } from "@/lib/prisma";

/**
 * Finds a subforum by its exact normalized name.
 *
 * @param name - The unique subforum name to look up.
 * @returns The matching subforum, or `null` when it does not exist.
 * @throws If the database query fails.
 */
export const findSubforumByName = (name: string) =>
  prisma.subforum.findUnique({ where: { name } });

/**
 * Finds a subforum by its unique ID.
 *
 * @param id - The subforum ID to look up.
 * @returns The matching subforum, or `null` when it does not exist.
 * @throws If the database query fails.
 */
export const findSubforumById = (id: string) =>
  prisma.subforum.findUnique({ where: { id } });

/**
 * Lists all approved subforums from newest to oldest.
 *
 * @returns Approved subforums including each owner's public ID and name.
 * @throws If the database query fails.
 */
export const listSubforums = () =>
  prisma.subforum.findMany({
    where: { isApproved: true },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

/**
 * Creates an immediately approved subforum owned by a user.
 *
 * @param data - The subforum name, description, and owner ID to persist.
 * @returns The newly created subforum record.
 * @throws If a constraint is violated or the database write fails.
 */
export const createSubforum = (data: {
  name: string;
  description: string;
  ownerId: string;
}) => prisma.subforum.create({ data: { ...data, isApproved: true } });
