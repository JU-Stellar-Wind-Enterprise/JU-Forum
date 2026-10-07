import { beforeEach, describe, expect, it, vi } from "vitest";
import * as postRepo from "@/repositories/post.repository";
import * as subforumRepo from "@/repositories/subforum.repository";
import { createPost } from "./post.service";

// Replace database repository calls with mock functions
vi.mock("@/repositories/post.repository", () => ({
  createPost: vi.fn(),
}));

vi.mock("@/repositories/subforum.repository", () => ({
  findSubforumById: vi.fn(),
}));

describe("post.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects post creation if title is empty", async () => {
    // 1. Arrange: prepare post input missing a title
    const input = {
      title: "",
      content: "Discussion about upcoming exams.",
      authorId: "user-1",
      subforumId: "sub-1",
    };

    // 2. Act: call createPost service function
    const result = await createPost(input);

    // 3. Assert: verify validation error and database was not called
    expect(result).toEqual({ message: "Title and content are required." });
    expect(postRepo.createPost).not.toHaveBeenCalled();
  });

  it("creates a post successfully when inputs and subforum are valid", async () => {
    // 1. Arrange: mock an approved subforum and post creation record
    vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
      id: "sub-1",
      name: "CSE Discussion",
      description: "CSE department discussions",
      isApproved: true,
      createdAt: new Date(),
      ownerId: "user-99",
    });
    vi.mocked(postRepo.createPost).mockResolvedValue({
      id: "post-101",
      title: "Introduction to Next.js",
      content: "Let us learn React and Next.js together.",
      authorId: "user-1",
      subforumId: "sub-1",
      isLocked: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Act: call createPost with valid data
    const result = await createPost({
      title: "Introduction to Next.js",
      content: "Let us learn React and Next.js together.",
      authorId: "user-1",
      subforumId: "sub-1",
    });

    // 3. Assert: verify success result returning the new post ID
    expect(result).toEqual({ success: true, data: { id: "post-101" } });
    expect(postRepo.createPost).toHaveBeenCalled();
  });
});
