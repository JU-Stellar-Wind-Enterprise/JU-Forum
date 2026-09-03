import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "@/generated/prisma/client";
import * as postRepo from "@/repositories/post.repository";
import * as subforumRepo from "@/repositories/subforum.repository";
import { createPost, findPostById } from "./post.service";

type PostWithRelations = Post & {
  author: { id: string; name: string };
  subforum: { id: string; name: string };
};

vi.mock("@/repositories/post.repository", () => ({
  createPost: vi.fn(),
  findPostById: vi.fn(),
}));

vi.mock("@/repositories/subforum.repository", () => ({
  findSubforumById: vi.fn(),
}));

describe("post.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPost", () => {
    it("returns error if title or content is empty or whitespace", async () => {
      const res1 = await createPost({
        title: "",
        content: "Valid content",
        authorId: "user-1",
        subforumId: "subforum-1",
      });
      expect(res1).toEqual({ message: "Title and content are required." });

      const res2 = await createPost({
        title: "   ",
        content: "Valid content",
        authorId: "user-1",
        subforumId: "subforum-1",
      });
      expect(res2).toEqual({ message: "Title and content are required." });

      const res3 = await createPost({
        title: "Valid title",
        content: "   ",
        authorId: "user-1",
        subforumId: "subforum-1",
      });
      expect(res3).toEqual({ message: "Title and content are required." });
    });

    it("returns error if title exceeds 150 characters", async () => {
      const res = await createPost({
        title: "a".repeat(151),
        content: "Valid content",
        authorId: "user-1",
        subforumId: "subforum-1",
      });
      expect(res).toEqual({ message: "Title must be 150 characters or less." });
    });

    it("returns error if content exceeds 10,000 characters", async () => {
      const res = await createPost({
        title: "Valid title",
        content: "a".repeat(10_001),
        authorId: "user-1",
        subforumId: "subforum-1",
      });
      expect(res).toEqual({
        message: "Content must be 10,000 characters or less.",
      });
    });

    it("returns error if subforum is not found", async () => {
      vi.mocked(subforumRepo.findSubforumById).mockResolvedValue(null);

      const res = await createPost({
        title: "Valid title",
        content: "Valid content",
        authorId: "user-1",
        subforumId: "non-existent-subforum",
      });

      expect(subforumRepo.findSubforumById).toHaveBeenCalledWith(
        "non-existent-subforum",
      );
      expect(res).toEqual({ message: "Select a valid subforum." });
      expect(postRepo.createPost).not.toHaveBeenCalled();
    });

    it("returns error if subforum is not approved", async () => {
      vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
        id: "sub-1",
        name: "Unapproved Subforum",
        description: "Pending",
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "user-2",
      });

      const res = await createPost({
        title: "Valid title",
        content: "Valid content",
        authorId: "user-1",
        subforumId: "sub-1",
      });

      expect(res).toEqual({ message: "Select a valid subforum." });
      expect(postRepo.createPost).not.toHaveBeenCalled();
    });

    it("trims title and content, creates post, and returns id", async () => {
      vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
        id: "sub-1",
        name: "Approved Subforum",
        description: "Active",
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "user-2",
      });
      vi.mocked(postRepo.createPost).mockResolvedValue({
        id: "post-100",
        title: "Trimmed Title",
        content: "Trimmed Content",
        authorId: "user-1",
        subforumId: "sub-1",
        isLocked: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createPost({
        title: "   Trimmed Title   ",
        content: "   Trimmed Content   ",
        authorId: "user-1",
        subforumId: "sub-1",
      });

      expect(postRepo.createPost).toHaveBeenCalledWith({
        title: "Trimmed Title",
        content: "Trimmed Content",
        authorId: "user-1",
        subforumId: "sub-1",
      });
      expect(res).toEqual({ success: true, data: { id: "post-100" } });
    });
  });

  describe("findPostById", () => {
    it("delegates to post repository and returns the post", async () => {
      const mockPost = {
        id: "post-1",
        title: "Test Post",
        content: "Post Content",
        author: { id: "u-1", name: "Author" },
        subforum: { id: "s-1", name: "General" },
      };
      vi.mocked(postRepo.findPostById).mockResolvedValue(
        mockPost as unknown as PostWithRelations,
      );

      const result = await findPostById("post-1");

      expect(postRepo.findPostById).toHaveBeenCalledWith("post-1");
      expect(result).toEqual(mockPost);
    });
  });
});
