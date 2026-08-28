import { prisma } from "@/lib/prisma";

/** Finds a subforum by its exact normalized name. */
export const findSubforumByName = (name: string) =>
  prisma.subforum.findUnique({ where: { name } });

/** Finds a subforum by ID. */
export const findSubforumById = (id: string) =>
  prisma.subforum.findUnique({ where: { id } });

/** Lists all active subforums, newest first. */
export const listSubforums = () =>
  prisma.subforum.findMany({
    where: { isApproved: true },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

/** Creates an immediately approved subforum owned by a user. */
export const createSubforum = (data: {
  name: string;
  description: string;
  ownerId: string;
}) => prisma.subforum.create({ data: { ...data, isApproved: true } });
