import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post, VoteType } from "@/generated/prisma/client";
import * as postRepo from "@/repositories/post.repository";
import * as voteRepo from "@/repositories/vote.repository";
import { getVoteSummary, voteOnPost } from "./vote.service";

type PostWithRelations = Post & {
  author: { id: string; name: string };
  subforum: { id: string; name: string };
};

vi.mock("@/repositories/post.repository", () => ({
  findPostById: vi.fn(),
}));

vi.mock("@/repositories/vote.repository", () => ({
  findVote: vi.fn(),
  createVote: vi.fn(),
  deleteVote: vi.fn(),
  updateVote: vi.fn(),
  getVoteSummary: vi.fn(),
}));

describe("vote.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("voteOnPost", () => {
    it("returns error if post is not found", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(null);

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "UPVOTE",
      });

      expect(postRepo.findPostById).toHaveBeenCalledWith("post-1");
      expect(res).toEqual({ message: "Post not found." });
      expect(voteRepo.findVote).not.toHaveBeenCalled();
    });

    it("returns error if post is locked", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        id: "post-1",
        isLocked: true,
        isArchived: false,
      } as unknown as PostWithRelations);

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "UPVOTE",
      });

      expect(res).toEqual({ message: "Voting is disabled for this post." });
      expect(voteRepo.findVote).not.toHaveBeenCalled();
    });

    it("returns error if post is archived", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        id: "post-1",
        isLocked: false,
        isArchived: true,
      } as unknown as PostWithRelations);

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "UPVOTE",
      });

      expect(res).toEqual({ message: "Voting is disabled for this post." });
      expect(voteRepo.findVote).not.toHaveBeenCalled();
    });

    it("creates a new vote when no existing vote found", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        id: "post-1",
        isLocked: false,
        isArchived: false,
      } as unknown as PostWithRelations);
      vi.mocked(voteRepo.findVote).mockResolvedValue(null);

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "UPVOTE",
      });

      expect(voteRepo.createVote).toHaveBeenCalledWith(
        "user-1",
        "post-1",
        "UPVOTE",
      );
      expect(res).toEqual({ success: true });
    });

    it("deletes existing vote when voting with the same type (toggle off)", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        id: "post-1",
        isLocked: false,
        isArchived: false,
      } as unknown as PostWithRelations);
      vi.mocked(voteRepo.findVote).mockResolvedValue({
        userId: "user-1",
        postId: "post-1",
        type: "UPVOTE" as VoteType,
      });

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "UPVOTE",
      });

      expect(voteRepo.deleteVote).toHaveBeenCalledWith("user-1", "post-1");
      expect(voteRepo.updateVote).not.toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });

    it("updates existing vote when switching vote type", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        id: "post-1",
        isLocked: false,
        isArchived: false,
      } as unknown as PostWithRelations);
      vi.mocked(voteRepo.findVote).mockResolvedValue({
        userId: "user-1",
        postId: "post-1",
        type: "UPVOTE" as VoteType,
      });

      const res = await voteOnPost({
        postId: "post-1",
        userId: "user-1",
        type: "DOWNVOTE",
      });

      expect(voteRepo.updateVote).toHaveBeenCalledWith(
        "user-1",
        "post-1",
        "DOWNVOTE",
      );
      expect(voteRepo.deleteVote).not.toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });
  });

  describe("getVoteSummary", () => {
    it("delegates to vote repository and returns summary", async () => {
      const mockSummary = {
        upvotes: 12,
        downvotes: 3,
        currentVote: "UPVOTE" as VoteType,
      };
      vi.mocked(voteRepo.getVoteSummary).mockResolvedValue(mockSummary);

      const result = await getVoteSummary("post-1", "user-1");

      expect(voteRepo.getVoteSummary).toHaveBeenCalledWith("post-1", "user-1");
      expect(result).toEqual(mockSummary);
    });
  });
});