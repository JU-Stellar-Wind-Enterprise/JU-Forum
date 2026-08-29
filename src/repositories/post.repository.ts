import { prisma } from "@/lib/prisma";

/**
 * Creates a post in a subforum for an authenticated author.
 *
 * @param data - The post content together with its author and subforum IDs.
 * @returns The newly created post record.
 * @throws If a related record is missing or the database write fails.
 */
export const createPost = (data: {
  title: string;
  content: string;
  authorId: string;
  subforumId: string;
}) => prisma.post.create({ data });

/**
 * Finds a post with the public author and subforum details needed by its page.
 *
 * @param id - The unique ID of the post to retrieve.
 * @returns The matching post with related display data, or `null`.
 * @throws If the database query fails.
 */
export const findPostById = (id: string) =>
  prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      subforum: { select: { id: true, name: true } },
    },
  });

/**
 * Lists posts in a subforum from newest to oldest.
 *
 * @param subforumId - The unique ID of the containing subforum.
 * @returns Matching posts with each author's public ID and name.
 * @throws If the database query fails.
 */
export const listPostsBySubforum = (subforumId: string) =>
  prisma.post.findMany({
    where: { subforumId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
