import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NewsFeedPage } from "@/types/news-feed";
import { NewsFeedClient } from "./NewsFeedClient";

vi.mock("@/actions/news-feed.actions", () => ({
  loadNewsFeedAction: vi.fn(),
  voteFeedPostAction: vi.fn(),
}));

const sampleFeed: NewsFeedPage = {
  items: [
    {
      kind: "ANNOUNCEMENT",
      id: "ann-1",
      title: "Semester Exam Schedule",
      excerpt: "Final exams start next Sunday.",
      priority: "URGENT",
      targetAudience: "STUDENTS",
      createdAt: "2026-11-09T09:00:00.000Z",
      expiresAt: null,
      author: { id: "admin-1", name: "Dr. Hasan", role: "ADMIN" },
      isPinned: true,
    },
    {
      kind: "POST",
      id: "post-1",
      title: "Best Study Spots on Campus",
      excerpt: "Central library second floor is super quiet.",
      createdAt: "2026-11-09T10:30:00.000Z",
      author: { id: "u-2", name: "Tasnim" },
      subforum: { id: "sub-1", name: "Campus Life" },
      upvotes: 5,
      downvotes: 1,
      score: 4,
      currentVote: null,
      commentCount: 3,
      isLocked: false,
    },
  ],
  page: 1,
  pageSize: 10,
  hasMore: true,
  nextPage: 2,
  totalCount: 3,
  followedSubforumCount: 0,
};

describe("NewsFeedClient", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders announcement and post metadata including author, subforum tag, vote count, and comment summary", () => {
    render(
      <NewsFeedClient
        initialFeed={sampleFeed}
        initialFilter="ALL"
        initialSort="LATEST"
        canVote={true}
      />,
    );

    expect(screen.getByText("Pinned")).toBeTruthy();
    expect(screen.getByText("Semester Exam Schedule")).toBeTruthy();
    expect(screen.getByText("Best Study Spots on Campus")).toBeTruthy();
    expect(screen.getByText("Campus Life")).toBeTruthy();
    expect(screen.getByText("By Tasnim")).toBeTruthy();
    expect(screen.getByText("3 comments")).toBeTruthy();
    expect(screen.getByText("Score 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upvote 5" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Downvote 1" })).toBeTruthy();
  });

  it("switches filter tabs and sort options seamlessly via loadFeed", async () => {
    const loadFeed = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [sampleFeed.items[1]],
        page: 1,
        pageSize: 10,
        hasMore: false,
        nextPage: null,
        totalCount: 1,
        followedSubforumCount: 0,
      },
    });

    render(
      <NewsFeedClient
        initialFeed={sampleFeed}
        initialFilter="ALL"
        initialSort="LATEST"
        canVote={true}
        loadFeed={loadFeed}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Discussions" }));

    await waitFor(() => {
      expect(loadFeed).toHaveBeenCalledWith({
        filter: "DISCUSSIONS",
        sort: "LATEST",
        page: 1,
      });
      expect(screen.queryByText("Semester Exam Schedule")).toBeNull();
      expect(
        (
          screen.getByRole("button", {
            name: "Most Upvoted",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    expect(screen.getByText("Best Study Spots on Campus")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Most Upvoted" }));

    await waitFor(() => {
      expect(loadFeed).toHaveBeenCalledWith({
        filter: "DISCUSSIONS",
        sort: "MOST_UPVOTED",
        page: 1,
      });
    });
  });

  it("loads additional items with Load more pagination without losing existing items", async () => {
    const loadFeed = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            kind: "POST",
            id: "post-2",
            title: "CSE 301 Notes",
            excerpt: "Uploaded lecture slides summary.",
            createdAt: "2026-11-08T12:00:00.000Z",
            author: { id: "u-3", name: "Nabil" },
            subforum: { id: "sub-2", name: "CSE" },
            upvotes: 2,
            downvotes: 0,
            score: 2,
            currentVote: null,
            commentCount: 1,
            isLocked: false,
          },
        ],
        page: 2,
        pageSize: 10,
        hasMore: false,
        nextPage: null,
        totalCount: 3,
        followedSubforumCount: 0,
      },
    });

    render(
      <NewsFeedClient
        initialFeed={sampleFeed}
        initialFilter="ALL"
        initialSort="LATEST"
        canVote={true}
        loadFeed={loadFeed}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => {
      expect(loadFeed).toHaveBeenCalledWith({
        filter: "ALL",
        sort: "LATEST",
        page: 2,
      });
    });

    expect(screen.getByText("Best Study Spots on Campus")).toBeTruthy();
    expect(screen.getByText("CSE 301 Notes")).toBeTruthy();
    expect(screen.getByText("1 comment")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("updates post vote counts optimistically and rolls back with error on failure", async () => {
    const votePost = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        data: { upvotes: 6, downvotes: 1, score: 5, currentVote: "UPVOTE" },
      })
      .mockResolvedValueOnce({
        message: "Unable to update vote. Please try again.",
      });

    render(
      <NewsFeedClient
        initialFeed={sampleFeed}
        initialFilter="ALL"
        initialSort="LATEST"
        canVote={true}
        votePost={votePost}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Upvote 5" }));

    await waitFor(() => {
      expect(votePost).toHaveBeenCalledWith({
        postId: "post-1",
        type: "UPVOTE",
      });
      expect(screen.getByText("Score 5")).toBeTruthy();
      expect(
        screen
          .getByRole("button", { name: "Upvote 6" })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(
        (
          screen.getByRole("button", {
            name: "Downvote 1",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Downvote 1" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Unable to update vote. Please try again.",
      );
      expect(screen.getByText("Score 5")).toBeTruthy();
    });
  });

  it("displays network interruption message and empty followed prompt", async () => {
    const loadFeed = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          page: 1,
          pageSize: 10,
          hasMore: false,
          nextPage: null,
          totalCount: 0,
          followedSubforumCount: 0,
        },
      });

    render(
      <NewsFeedClient
        initialFeed={sampleFeed}
        initialFilter="ALL"
        initialSort="LATEST"
        canVote={true}
        loadFeed={loadFeed}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Followed (0)" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Unable to load feed items. Please refresh.",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(
        screen.getByText("You are not following any subforums yet."),
      ).toBeTruthy();
    });
    expect(
      screen.getByRole("link", { name: "Browse subforums to follow" }),
    ).toBeTruthy();
  });
});
