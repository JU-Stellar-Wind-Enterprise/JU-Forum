import { beforeEach, describe, expect, it, vi } from "vitest";
import * as pollRepo from "@/repositories/poll.repository";
import * as subforumRepo from "@/repositories/subforum.repository";
import {
  approvePollRequest,
  closePoll,
  createPollRequest,
  getPollWithResults,
  rejectPollRequest,
  voteInPoll,
} from "./poll.service";

vi.mock("@/repositories/poll.repository", () => ({
  createPoll: vi.fn(),
  findPollById: vi.fn(),
  updatePoll: vi.fn(),
  deletePoll: vi.fn(),
  createPollVote: vi.fn(),
  findUserPollVote: vi.fn(),
  listApprovedPolls: vi.fn(),
  listPendingPolls: vi.fn(),
  isUserSubforumModerator: vi.fn(),
}));

vi.mock("@/repositories/subforum.repository", () => ({
  findSubforumById: vi.fn(),
}));

const mockAuthor = {
  id: "user-1",
  name: "User One",
  role: "STUDENT" as const,
};

const mockSubforum = {
  id: "sub-1",
  name: "Tech Forum",
};

describe("poll.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPollRequest", () => {
    it("rejects creation if question is empty", async () => {
      const result = await createPollRequest({
        question: "   ",
        options: ["Option A", "Option B"],
        authorId: "user-1",
      });

      expect(result).toEqual({
        message:
          "Poll creation failed. Please enter a question and at least two voting options.",
      });
      expect(pollRepo.createPoll).not.toHaveBeenCalled();
    });

    it("rejects creation if fewer than two valid options are provided", async () => {
      const result = await createPollRequest({
        question: "What is your favorite framework?",
        options: ["Only One Option", "   "],
        authorId: "user-1",
      });

      expect(result).toEqual({
        message:
          "Poll creation failed. Please enter a question and at least two voting options.",
      });
      expect(pollRepo.createPoll).not.toHaveBeenCalled();
    });

    it("rejects creation if subforum does not exist or is not approved", async () => {
      vi.mocked(subforumRepo.findSubforumById).mockResolvedValue(null);

      const result = await createPollRequest({
        question: "Best programming language?",
        options: ["TypeScript", "Python"],
        authorId: "user-1",
        subforumId: "invalid-subforum",
      });

      expect(result).toEqual({
        message: "Select a valid subforum.",
      });
      expect(pollRepo.createPoll).not.toHaveBeenCalled();
    });

    it("creates a poll request with isApproved=false for moderator approval", async () => {
      vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
        id: "sub-1",
        name: "Tech Forum",
        description: "All tech talk",
        isApproved: true,
        ownerId: "user-admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(pollRepo.createPoll).mockResolvedValue({
        id: "poll-101",
        question: "Best framework?",
        description: "Vote for your preferred library",
        isApproved: false,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [
          { id: "opt-1", text: "React", pollId: "poll-101" },
          { id: "opt-2", text: "Vue", pollId: "poll-101" },
        ],
        author: mockAuthor,
      });

      const result = await createPollRequest({
        question: "Best framework?",
        description: "Vote for your preferred library",
        options: ["React", "Vue"],
        authorId: "user-1",
        subforumId: "sub-1",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "poll-101" },
        message: "Poll request submitted successfully for moderator approval.",
      });
      expect(pollRepo.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "Best framework?",
          isApproved: false,
        }),
      );
    });
  });

  describe("approvePollRequest", () => {
    it("rejects approval if user is not a moderator or admin", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Campus fest dates?",
        description: null,
        isApproved: false,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      const result = await approvePollRequest({
        pollId: "poll-101",
        reviewerId: "user-student",
        reviewerRole: "STUDENT",
      });

      expect(result).toEqual({
        message: "You are not authorized to moderate polls.",
      });
      expect(pollRepo.updatePoll).not.toHaveBeenCalled();
    });

    it("approves the poll request when reviewed by an ADMIN", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Campus fest dates?",
        description: null,
        isApproved: false,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: mockAuthor,
        subforum: mockSubforum,
      });

      vi.mocked(pollRepo.updatePoll).mockResolvedValue({
        id: "poll-101",
        question: "Campus fest dates?",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await approvePollRequest({
        pollId: "poll-101",
        reviewerId: "admin-1",
        reviewerRole: "ADMIN",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "poll-101" },
        message: "Poll approved and published successfully.",
      });
      expect(pollRepo.updatePoll).toHaveBeenCalledWith("poll-101", {
        isApproved: true,
      });
    });
  });

  describe("rejectPollRequest", () => {
    it("deletes a pending poll request when rejected by a moderator", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Spam question?",
        description: null,
        isApproved: false,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: mockAuthor,
        subforum: mockSubforum,
      });

      const result = await rejectPollRequest({
        pollId: "poll-101",
        reviewerId: "mod-1",
        reviewerRole: "MODERATOR",
      });

      expect(result).toEqual({
        success: true,
        message: "Poll request has been rejected.",
      });
      expect(pollRepo.deletePoll).toHaveBeenCalledWith("poll-101");
    });
  });

  describe("voteInPoll", () => {
    it("rejects vote if user is unauthenticated", async () => {
      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "",
      });

      expect(result).toEqual({
        message: "You must be logged in to vote.",
      });
      expect(pollRepo.createPollVote).not.toHaveBeenCalled();
    });

    it("rejects vote if poll does not exist or is not approved", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Pending poll",
        description: null,
        isApproved: false,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [{ id: "opt-1", text: "Opt 1", pollId: "poll-101" }],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "user-2",
      });

      expect(result).toEqual({
        message: "This poll is not yet approved or does not exist.",
      });
      expect(pollRepo.createPollVote).not.toHaveBeenCalled();
    });

    it("rejects vote if poll is closed", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Closed poll",
        description: null,
        isApproved: true,
        isClosed: true,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [{ id: "opt-1", text: "Opt 1", pollId: "poll-101" }],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "user-2",
      });

      expect(result).toEqual({
        message: "This poll is closed and no longer accepting votes.",
      });
      expect(pollRepo.createPollVote).not.toHaveBeenCalled();
    });

    it("rejects vote if poll has expired past closing date", async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000);
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Expired poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: pastDate,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [{ id: "opt-1", text: "Opt 1", pollId: "poll-101" }],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "user-2",
      });

      expect(result).toEqual({
        message: "This poll is closed and no longer accepting votes.",
      });
      expect(pollRepo.createPollVote).not.toHaveBeenCalled();
    });

    it("rejects duplicate vote submission from the same user", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Active poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [{ id: "opt-1", text: "Opt 1", pollId: "poll-101" }],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      vi.mocked(pollRepo.findUserPollVote).mockResolvedValue({
        userId: "user-2",
        pollId: "poll-101",
        optionId: "opt-1",
        createdAt: new Date(),
      });

      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "user-2",
      });

      expect(result).toEqual({
        message: "You have already voted in this poll.",
      });
      expect(pollRepo.createPollVote).not.toHaveBeenCalled();
    });

    it("casts vote successfully on valid active poll", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Active poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [
          { id: "opt-1", text: "React", pollId: "poll-101" },
          { id: "opt-2", text: "Vue", pollId: "poll-101" },
        ],
        votes: [],
        author: mockAuthor,
        subforum: null,
      });

      vi.mocked(pollRepo.findUserPollVote).mockResolvedValue(null);
      vi.mocked(pollRepo.createPollVote).mockResolvedValue({
        userId: "user-2",
        pollId: "poll-101",
        optionId: "opt-1",
        createdAt: new Date(),
      });

      const result = await voteInPoll({
        pollId: "poll-101",
        optionId: "opt-1",
        userId: "user-2",
      });

      expect(result).toEqual({
        success: true,
        message: "Vote cast successfully.",
      });
      expect(pollRepo.createPollVote).toHaveBeenCalledWith({
        userId: "user-2",
        pollId: "poll-101",
        optionId: "opt-1",
      });
    });
  });

  describe("closePoll", () => {
    it("allows the poll author to close the poll", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "My Poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "author-user",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: { id: "author-user", name: "Author", role: "STUDENT" },
        subforum: mockSubforum,
      });

      const result = await closePoll({
        pollId: "poll-101",
        userId: "author-user",
        userRole: "STUDENT",
      });

      expect(result).toEqual({
        success: true,
        message: "Poll closed successfully.",
      });
      expect(pollRepo.updatePoll).toHaveBeenCalledWith("poll-101", {
        isClosed: true,
      });
    });

    it("allows an admin or moderator to close any poll", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Another Poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "other-user",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: mockAuthor,
        subforum: mockSubforum,
      });

      const result = await closePoll({
        pollId: "poll-101",
        userId: "admin-user",
        userRole: "ADMIN",
      });

      expect(result).toEqual({
        success: true,
        message: "Poll closed successfully.",
      });
      expect(pollRepo.updatePoll).toHaveBeenCalledWith("poll-101", {
        isClosed: true,
      });
    });

    it("rejects unauthorized users from closing someone else's poll", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Another Poll",
        description: null,
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "author-user",
        subforumId: "sub-1",
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [],
        votes: [],
        author: { id: "author-user", name: "Author", role: "STUDENT" },
        subforum: mockSubforum,
      });
      vi.mocked(pollRepo.isUserSubforumModerator).mockResolvedValue(false);

      const result = await closePoll({
        pollId: "poll-101",
        userId: "random-student",
        userRole: "STUDENT",
      });

      expect(result).toEqual({
        message: "You are not authorized to close this poll.",
      });
      expect(pollRepo.updatePoll).not.toHaveBeenCalled();
    });
  });

  describe("getPollWithResults", () => {
    it("calculates vote counts and percentages for all options", async () => {
      vi.mocked(pollRepo.findPollById).mockResolvedValue({
        id: "poll-101",
        question: "Preferred OS?",
        description: "Operating system preferences",
        isApproved: true,
        isClosed: false,
        expiresAt: null,
        authorId: "user-1",
        subforumId: null,
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [
          { id: "opt-linux", text: "Linux", pollId: "poll-101" },
          { id: "opt-win", text: "Windows", pollId: "poll-101" },
          { id: "opt-mac", text: "macOS", pollId: "poll-101" },
        ],
        votes: [
          {
            userId: "u-1",
            pollId: "poll-101",
            optionId: "opt-linux",
            createdAt: new Date(),
          },
          {
            userId: "u-2",
            pollId: "poll-101",
            optionId: "opt-linux",
            createdAt: new Date(),
          },
          {
            userId: "u-3",
            pollId: "poll-101",
            optionId: "opt-win",
            createdAt: new Date(),
          },
        ],
        author: mockAuthor,
        subforum: null,
      });

      const poll = await getPollWithResults("poll-101", "u-1");

      expect(poll).not.toBeNull();
      expect(poll?.totalVotes).toBe(3);
      expect(poll?.userVotedOptionId).toBe("opt-linux");
      expect(poll?.options).toEqual([
        { id: "opt-linux", text: "Linux", voteCount: 2, percentage: 67 },
        { id: "opt-win", text: "Windows", voteCount: 1, percentage: 33 },
        { id: "opt-mac", text: "macOS", voteCount: 0, percentage: 0 },
      ]);
    });
  });
});
