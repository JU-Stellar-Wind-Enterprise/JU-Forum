import { describe, expect, it, vi } from "vitest";
import * as postRepo from "@/repositories/post.repository";
import * as voteRepo from "@/repositories/vote.repository";
import { voteOnPost } from "./vote.service";

vi.mock("@/repositories/post.repository", () => ({
  findPostById: vi.fn(),
}));

vi.mock("@/repositories/vote.repository", () => ({
  findVote: vi.fn(),
  createVote: vi.fn(),
  deleteVote: vi.fn(),
}));

describe("Vote Service", () => {

  it("create vote", async () => {
    vi.mocked(postRepo.findPostById).mockResolvedValue({
      isLocked: false,
      isArchived: false,
    } as any);

    vi.mocked(voteRepo.findVote).mockResolvedValue(null);

    await voteOnPost({
      postId: "1",
      userId: "1",
      type: "UPVOTE",
    });

    expect(voteRepo.createVote).toHaveBeenCalled();
  });

  it("delete vote", async () => {
    vi.mocked(postRepo.findPostById).mockResolvedValue({
      isLocked: false,
      isArchived: false,
    } as any);

    vi.mocked(voteRepo.findVote).mockResolvedValue({
      type: "UPVOTE",
    } as any);

    await voteOnPost({
      postId: "1",
      userId: "1",
      type: "UPVOTE",
    });

    expect(voteRepo.deleteVote).toHaveBeenCalled();
  });

  it("post not found", async () => {
    vi.mocked(postRepo.findPostById).mockResolvedValue(null);

    const result = await voteOnPost({
      postId: "1",
      userId: "1",
      type: "UPVOTE",
    });

    expect(result).toEqual({
      message: "Wrong",
    });
  });

});