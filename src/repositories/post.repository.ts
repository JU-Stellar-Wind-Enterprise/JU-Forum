import { prisma } from "@/lib/prisma";

/** Creates a post in a subforum for an authenticated author. */
export const createPost = (data: {
  title: string;
  content: string;
  authorId: string;
  subforumId: string;
}) => prisma.post.create({ data });

/** Finds a post with the public author and subforum details needed by its page. */
export const findPostById = (id: string) =>
  prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      subforum: { select: { id: true, name: true } },
    },
  });

/** Lists posts in a subforum from newest to oldest. */
export const listPostsBySubforum = (subforumId: string) =>
  prisma.post.findMany({
    where: { subforumId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });