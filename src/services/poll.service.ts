import * as polls from "@/repositories/poll.repository";
import { findSubforumById } from "@/repositories/subforum.repository";
import type { ActionResult } from "@/types/result";

export interface CreatePollRequestInput {
  question: string;
  description?: string;
  options: string[];
  expiresAt?: string | Date | null;
  authorId: string;
  subforumId?: string;
  postId?: string;
}

export interface VoteInPollInput {
  pollId: string;
  optionId: string;
  userId: string;
}

export interface ClosePollInput {
  pollId: string;
  userId: string;
  userRole: string;
}

export interface ReviewPollRequestInput {
  pollId: string;
  reviewerId: string;
  reviewerRole: string;
}

export interface PollOptionResult {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface PollWithResults {
  id: string;
  question: string;
  description: string | null;
  expiresAt: Date | null;
  isClosed: boolean;
  isApproved: boolean;
  authorId: string;
  author?: { id: string; name: string; role: string };
  subforumId: string | null;
  subforum?: { id: string; name: string } | null;
  postId: string | null;
  createdAt: Date;
  updatedAt: Date;
  options: PollOptionResult[];
  totalVotes: number;
  userVotedOptionId: string | null;
}

/**
 * Validates and submits a new poll request for moderator approval.
 *
 * @param input - The poll question, description, options, author ID, and optional subforum.
 * @returns An ActionResult containing the created poll request ID or an error message.
 */
export async function createPollRequest(
  input: CreatePollRequestInput,
): Promise<ActionResult<{ id: string }>> {
  const question = input.question?.trim() || "";
  const cleanedOptions = (input.options || [])
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0);

  if (!question || cleanedOptions.length < 2) {
    return {
      message:
        "Poll creation failed. Please enter a question and at least two voting options.",
    };
  }

  if (input.subforumId) {
    const subforum = await findSubforumById(input.subforumId);
    if (!subforum || !subforum.isApproved) {
      return { message: "Select a valid subforum." };
    }
  }

  let parsedExpiresAt: Date | null = null;
  if (input.expiresAt) {
    const d = new Date(input.expiresAt);
    if (!Number.isNaN(d.getTime())) {
      parsedExpiresAt = d;
    }
  }

  const poll = await polls.createPoll({
    question,
    description: input.description?.trim() || null,
    options: cleanedOptions,
    expiresAt: parsedExpiresAt,
    authorId: input.authorId,
    subforumId: input.subforumId || null,
    postId: input.postId || null,
    isApproved: false,
  });

  return {
    success: true,
    data: { id: poll.id },
    message: "Poll request submitted successfully for moderator approval.",
  };
}

/**
 * Approves a pending poll request, publishing it for public participation.
 *
 * @param input - The poll ID, reviewer ID, and reviewer role.
 * @returns An ActionResult confirming approval or an authorization error.
 */
export async function approvePollRequest(
  input: ReviewPollRequestInput,
): Promise<ActionResult<{ id: string }>> {
  const poll = await polls.findPollById(input.pollId);
  if (!poll) {
    return { message: "Poll not found." };
  }

  const isModeratorRole =
    input.reviewerRole === "ADMIN" ||
    input.reviewerRole === "SYSTEM_ADMIN" ||
    input.reviewerRole === "MODERATOR";

  let isSubforumMod = false;
  if (poll.subforumId) {
    isSubforumMod = await polls.isUserSubforumModerator(
      input.reviewerId,
      poll.subforumId,
    );
  }

  if (!isModeratorRole && !isSubforumMod) {
    return { message: "You are not authorized to moderate polls." };
  }

  await polls.updatePoll(input.pollId, { isApproved: true });

  return {
    success: true,
    data: { id: input.pollId },
    message: "Poll approved and published successfully.",
  };
}

/**
 * Rejects and deletes a pending poll request.
 *
 * @param input - The poll ID, reviewer ID, and reviewer role.
 * @returns An ActionResult confirming rejection or an authorization error.
 */
export async function rejectPollRequest(
  input: ReviewPollRequestInput,
): Promise<ActionResult> {
  const poll = await polls.findPollById(input.pollId);
  if (!poll) {
    return { message: "Poll not found." };
  }

  const isModeratorRole =
    input.reviewerRole === "ADMIN" ||
    input.reviewerRole === "SYSTEM_ADMIN" ||
    input.reviewerRole === "MODERATOR";

  let isSubforumMod = false;
  if (poll.subforumId) {
    isSubforumMod = await polls.isUserSubforumModerator(
      input.reviewerId,
      poll.subforumId,
    );
  }

  if (!isModeratorRole && !isSubforumMod) {
    return { message: "You are not authorized to moderate polls." };
  }

  await polls.deletePoll(input.pollId);

  return {
    success: true,
    message: "Poll request has been rejected.",
  };
}

/**
 * Casts a vote on an option in an approved, active poll.
 *
 * @param input - The target poll ID, option ID, and voter user ID.
 * @returns An ActionResult confirming the vote or rejecting duplicate/invalid votes.
 */
export async function voteInPoll(
  input: VoteInPollInput,
): Promise<ActionResult> {
  if (!input.userId) {
    return { message: "You must be logged in to vote." };
  }

  const poll = await polls.findPollById(input.pollId);
  if (!poll || !poll.isApproved) {
    return { message: "This poll is not yet approved or does not exist." };
  }

  const isExpired =
    poll.expiresAt !== null && new Date(poll.expiresAt) <= new Date();
  if (poll.isClosed || isExpired) {
    return { message: "This poll is closed and no longer accepting votes." };
  }

  const optionExists = poll.options.some((opt) => opt.id === input.optionId);
  if (!optionExists) {
    return { message: "Invalid voting option selected." };
  }

  const existingVote = await polls.findUserPollVote(input.userId, input.pollId);
  if (existingVote) {
    return { message: "You have already voted in this poll." };
  }

  await polls.createPollVote({
    userId: input.userId,
    pollId: input.pollId,
    optionId: input.optionId,
  });

  return {
    success: true,
    message: "Vote cast successfully.",
  };
}

/**
 * Closes an active poll so no further votes can be submitted.
 *
 * @param input - The target poll ID, user ID, and user role.
 * @returns An ActionResult confirming poll closure or authorization error.
 */
export async function closePoll(input: ClosePollInput): Promise<ActionResult> {
  const poll = await polls.findPollById(input.pollId);
  if (!poll) {
    return { message: "Poll not found." };
  }

  if (poll.isClosed) {
    return { message: "This poll is already closed." };
  }

  const isAuthor = poll.authorId === input.userId;
  const isModeratorRole =
    input.userRole === "ADMIN" ||
    input.userRole === "SYSTEM_ADMIN" ||
    input.userRole === "MODERATOR";

  let isSubforumMod = false;
  if (poll.subforumId) {
    isSubforumMod = await polls.isUserSubforumModerator(
      input.userId,
      poll.subforumId,
    );
  }

  if (!isAuthor && !isModeratorRole && !isSubforumMod) {
    return { message: "You are not authorized to close this poll." };
  }

  await polls.updatePoll(input.pollId, { isClosed: true });

  return {
    success: true,
    message: "Poll closed successfully.",
  };
}

/**
 * Retrieves a poll and aggregates vote tallies and percentage bars.
 *
 * @param pollId - The unique ID of the poll.
 * @param currentUserId - Optional current user ID to determine user's chosen option.
 * @returns The poll with enriched vote statistics, or null if not found.
 */
export async function getPollWithResults(
  pollId: string,
  currentUserId?: string,
): Promise<PollWithResults | null> {
  const poll = await polls.findPollById(pollId);
  if (!poll) return null;

  const votes = poll.votes || [];
  const totalVotes = votes.length;

  let userVotedOptionId: string | null = null;
  if (currentUserId) {
    const userVote = votes.find((v) => v.userId === currentUserId);
    if (userVote) {
      userVotedOptionId = userVote.optionId;
    }
  }

  const options: PollOptionResult[] = poll.options.map((option) => {
    const optionVotes = votes.filter((v) => v.optionId === option.id);
    const voteCount = optionVotes.length;
    const percentage =
      totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return {
      id: option.id,
      text: option.text,
      voteCount,
      percentage,
    };
  });

  return {
    id: poll.id,
    question: poll.question,
    description: poll.description,
    expiresAt: poll.expiresAt,
    isClosed: poll.isClosed,
    isApproved: poll.isApproved,
    authorId: poll.authorId,
    author: poll.author,
    subforumId: poll.subforumId,
    subforum: poll.subforum,
    postId: poll.postId,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    options,
    totalVotes,
    userVotedOptionId,
  };
}

/**
 * Lists all approved polls with calculated vote percentages.
 *
 * @param subforumId - Optional subforum filter.
 * @param currentUserId - Optional current user ID.
 * @returns Array of enriched approved polls.
 */
export async function listApprovedPolls(
  subforumId?: string,
  currentUserId?: string,
): Promise<PollWithResults[]> {
  const pollList = await polls.listApprovedPolls(subforumId);
  return pollList.map((poll) => {
    const votes = poll.votes || [];
    const totalVotes = votes.length;

    let userVotedOptionId: string | null = null;
    if (currentUserId) {
      const userVote = votes.find((v) => v.userId === currentUserId);
      if (userVote) {
        userVotedOptionId = userVote.optionId;
      }
    }

    const options: PollOptionResult[] = poll.options.map((option) => {
      const optionVotes = votes.filter((v) => v.optionId === option.id);
      const voteCount = optionVotes.length;
      const percentage =
        totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      return {
        id: option.id,
        text: option.text,
        voteCount,
        percentage,
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      expiresAt: poll.expiresAt,
      isClosed: poll.isClosed,
      isApproved: poll.isApproved,
      authorId: poll.authorId,
      author: poll.author,
      subforumId: poll.subforumId,
      subforum: poll.subforum,
      postId: poll.postId,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      options,
      totalVotes,
      userVotedOptionId,
    };
  });
}

/**
 * Lists pending poll requests awaiting review.
 *
 * @param subforumId - Optional subforum filter.
 * @returns Pending polls with author and options details.
 */
export async function listPendingPollRequests(subforumId?: string) {
  return polls.listPendingPolls(subforumId);
}
