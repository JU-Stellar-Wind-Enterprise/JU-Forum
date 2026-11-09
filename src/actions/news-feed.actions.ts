"use server";

import { revalidatePath } from "next/cache";
import type { VoteType } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import { getNewsFeed } from "@/services/news-feed.service";
import { getVoteSummary, voteOnPost } from "@/services/vote.service";
import type {
  FeedFilter,
  FeedSort,
  FeedVoteSummary,
  NewsFeedPage,
} from "@/types/news-feed";
import type { ActionResult } from "@/types/result";

/**
 * Loads a paginated slice of the authenticated user's personalized news feed.
 *
 * @param input - The active feed filter, sort order, and target page number.
 * @returns The matching feed page or an authorization/network error message.
 */
export async function loadNewsFeedAction(input: {
  filter: FeedFilter;
  sort: FeedSort;
  page: number;
}): Promise<ActionResult<NewsFeedPage>> {
  const user = await getCurrentUser();
  if (!user) return { message: "You must be logged in." };

  return getNewsFeed({
    userId: user.id,
    userRole: user.role,
    filter: input.filter,
    sort: input.sort,
    page: input.page,
  });
}

/**
 * Applies a post upvote or downvote from the news feed and returns updated totals.
 *
 * @param input - The target post ID and requested vote type.
 * @returns Updated vote counts and viewer vote state, or a user-facing error message.
 */
export async function voteFeedPostAction(input: {
  postId: string;
  type: VoteType;
}): Promise<ActionResult<FeedVoteSummary>> {
  const user = await getCurrentUser();
  if (!user) return { message: "You must be logged in." };
  if (user.status === "SUSPENDED") {
    return { message: "Suspended accounts cannot participate in voting." };
  }
  if (user.status !== "ACTIVE") {
    return { message: "Only active accounts can vote on posts." };
  }
  if (input.type !== "UPVOTE" && input.type !== "DOWNVOTE") {
    return { message: "Invalid vote type." };
  }

  try {
    const result = await voteOnPost({
      postId: input.postId,
      userId: user.id,
      type: input.type,
    });
    if (!result.success) return { message: result.message };

    const summary = await getVoteSummary(input.postId, user.id);
    revalidatePath(`/post/${input.postId}`);

    return {
      success: true,
      data: {
        ...summary,
        score: summary.upvotes - summary.downvotes,
      },
    };
  } catch {
    return { message: "Unable to update vote. Please try again." };
  }
}
