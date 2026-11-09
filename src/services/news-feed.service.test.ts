import { beforeEach, describe, expect, it, vi } from "vitest";
import * as newsFeedRepo from "@/repositories/news-feed.repository";
import { getNewsFeed } from "./news-feed.service";

vi.mock("@/repositories/news-feed.repository", () => ({
  findFollowedSubforumIds: vi.fn(),
  listActiveFeedPosts: vi.fn(),
  listActiveFeedAnnouncements: vi.fn(),
}));

const makePost = (overrides: {
  id: string;
  title?: string;
  content?: string;
  createdAt: Date;
  isLocked?: boolean;
  isArchived?: boolean;
  author?: { id: string; name: string; isDeleted: boolean };
  subforum?: { id: string; name: string; isApproved: boolean };
  votes?: { userId: string; type: "UPVOTE" | "DOWNVOTE" }[];
  commentCount?: number;
}) => ({
  id: overrides.id,
  title: overrides.title ?? `Post ${overrides.id}`,
  content: overrides.content ?? `Body content for ${overrides.id}`,
  isLocked: overrides.isLocked ?? false,
  isArchived: overrides.isArchived ?? false,
  createdAt: overrides.createdAt,
  author: overrides.author ?? {
    id: "author-1",
    name: "Amina Rahman",
    isDeleted: false,
  },
  subforum: overrides.subforum ?? {
    id: "sub-1",
    name: "CSE Discussion",
    isApproved: true,
  },
  votes: overrides.votes ?? [],
  _count: {
    comments: overrides.commentCount ?? 0,
  },
});

const makeAnnouncement = (overrides: {
  id: string;
  title?: string;
  content?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  targetAudience?: "ALL" | "STUDENTS" | "FACULTY" | "STAFF";
  createdAt: Date;
  expiresAt?: Date | null;
  author?: { id: string; name: string; role: "FACULTY" | "ADMIN" | "STAFF" };
}) => ({
  id: overrides.id,
  title: overrides.title ?? `Announcement ${overrides.id}`,
  content: overrides.content ?? `Official notice for ${overrides.id}`,
  priority: overrides.priority ?? "MEDIUM",
  targetAudience: overrides.targetAudience ?? "ALL",
  createdAt: overrides.createdAt,
  expiresAt: overrides.expiresAt ?? null,
  author: overrides.author ?? {
    id: "admin-1",
    name: "Dr. Karim",
    role: "ADMIN",
  },
});

describe("news-feed.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(newsFeedRepo.findFollowedSubforumIds).mockResolvedValue([]);
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([]);
    vi.mocked(newsFeedRepo.listActiveFeedAnnouncements).mockResolvedValue([]);
  });

  it("rejects unauthenticated requests when userId is missing", async () => {
    const result = await getNewsFeed({
      userId: "",
      userRole: "STUDENT",
    });

    expect(result).toEqual({ message: "You must be logged in." });
    expect(newsFeedRepo.listActiveFeedPosts).not.toHaveBeenCalled();
    expect(newsFeedRepo.listActiveFeedAnnouncements).not.toHaveBeenCalled();
  });

  it("aggregates active posts and announcements with URGENT/HIGH announcements pinned first in ALL + LATEST", async () => {
    const t1 = new Date("2026-11-08T10:00:00Z");
    const t2 = new Date("2026-11-08T12:00:00Z");
    const t3 = new Date("2026-11-09T09:00:00Z");
    const t4 = new Date("2026-11-09T11:00:00Z");

    vi.mocked(newsFeedRepo.findFollowedSubforumIds).mockResolvedValue([
      "sub-1",
    ]);
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-new",
        title: "Algorithm Lab Help",
        content: "Anyone finished lab 3?",
        createdAt: t4,
        votes: [
          { userId: "user-1", type: "UPVOTE" },
          { userId: "user-2", type: "UPVOTE" },
          { userId: "user-3", type: "DOWNVOTE" },
        ],
        commentCount: 4,
      }),
      makePost({
        id: "post-old",
        createdAt: t1,
      }),
    ]);
    vi.mocked(newsFeedRepo.listActiveFeedAnnouncements).mockResolvedValue([
      makeAnnouncement({
        id: "ann-urgent",
        priority: "URGENT",
        createdAt: t1,
      }),
      makeAnnouncement({
        id: "ann-high",
        priority: "HIGH",
        createdAt: t2,
      }),
      makeAnnouncement({
        id: "ann-medium",
        priority: "MEDIUM",
        createdAt: t3,
      }),
    ]);

    const result = await getNewsFeed({
      userId: "user-1",
      userRole: "STUDENT",
      filter: "ALL",
      sort: "LATEST",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.followedSubforumCount).toBe(1);
    expect(result.data.items.map((item) => item.id)).toEqual([
      "ann-urgent",
      "ann-high",
      "post-new",
      "ann-medium",
      "post-old",
    ]);

    const postCard = result.data.items[2];
    expect(postCard).toMatchObject({
      kind: "POST",
      id: "post-new",
      title: "Algorithm Lab Help",
      author: { id: "author-1", name: "Amina Rahman" },
      subforum: { id: "sub-1", name: "CSE Discussion" },
      upvotes: 2,
      downvotes: 1,
      score: 1,
      currentVote: "UPVOTE",
      commentCount: 4,
    });
  });

  it("queries announcements matching the viewer's role", async () => {
    await getNewsFeed({ userId: "u1", userRole: "STUDENT" });
    expect(newsFeedRepo.listActiveFeedAnnouncements).toHaveBeenCalledWith([
      "ALL",
      "STUDENTS",
    ]);

    vi.clearAllMocks();
    await getNewsFeed({ userId: "u2", userRole: "FACULTY" });
    expect(newsFeedRepo.listActiveFeedAnnouncements).toHaveBeenCalledWith([
      "ALL",
      "FACULTY",
    ]);

    vi.clearAllMocks();
    await getNewsFeed({ userId: "u3", userRole: "STAFF" });
    expect(newsFeedRepo.listActiveFeedAnnouncements).toHaveBeenCalledWith([
      "ALL",
      "STAFF",
    ]);

    vi.clearAllMocks();
    await getNewsFeed({ userId: "u4", userRole: "ADMIN" });
    expect(newsFeedRepo.listActiveFeedAnnouncements).toHaveBeenCalledWith([
      "ALL",
    ]);
  });

  it("excludes archived posts, posts in unapproved/archived subforums, and expired announcements", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60_000);
    const future = new Date(now.getTime() + 60_000);

    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-active",
        createdAt: now,
      }),
      makePost({
        id: "post-archived",
        isArchived: true,
        createdAt: now,
      }),
      makePost({
        id: "post-unapproved-sub",
        subforum: { id: "sub-2", name: "Closed Club", isApproved: false },
        createdAt: now,
      }),
    ]);
    vi.mocked(newsFeedRepo.listActiveFeedAnnouncements).mockResolvedValue([
      makeAnnouncement({
        id: "ann-expired",
        expiresAt: past,
        createdAt: now,
      }),
      makeAnnouncement({
        id: "ann-wrong-audience",
        targetAudience: "FACULTY",
        expiresAt: future,
        createdAt: now,
      }),
      makeAnnouncement({
        id: "ann-valid",
        targetAudience: "STUDENTS",
        expiresAt: future,
        createdAt: now,
      }),
    ]);

    const result = await getNewsFeed({
      userId: "student-1",
      userRole: "STUDENT",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.items.map((item) => item.id)).toEqual([
      "post-active",
      "ann-valid",
    ]);
  });

  it("filters by DISCUSSIONS only without fetching announcements", async () => {
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({ id: "post-1", createdAt: new Date("2026-11-09T10:00:00Z") }),
    ]);

    const result = await getNewsFeed({
      userId: "student-1",
      userRole: "STUDENT",
      filter: "DISCUSSIONS",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.items.map((item) => item.id)).toEqual(["post-1"]);
    expect(newsFeedRepo.listActiveFeedAnnouncements).not.toHaveBeenCalled();
  });

  it("filters by ANNOUNCEMENTS only without fetching posts", async () => {
    vi.mocked(newsFeedRepo.listActiveFeedAnnouncements).mockResolvedValue([
      makeAnnouncement({
        id: "ann-1",
        createdAt: new Date("2026-11-09T10:00:00Z"),
      }),
    ]);

    const result = await getNewsFeed({
      userId: "student-1",
      userRole: "STUDENT",
      filter: "ANNOUNCEMENTS",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.items.map((item) => item.id)).toEqual(["ann-1"]);
    expect(newsFeedRepo.listActiveFeedPosts).not.toHaveBeenCalled();
  });

  it("filters by FOLLOWED subforums and returns empty smoothly when user follows none", async () => {
    vi.mocked(newsFeedRepo.findFollowedSubforumIds).mockResolvedValue([]);

    const emptyResult = await getNewsFeed({
      userId: "user-1",
      userRole: "STUDENT",
      filter: "FOLLOWED",
    });

    expect(emptyResult).toEqual({
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
    expect(newsFeedRepo.listActiveFeedPosts).not.toHaveBeenCalled();

    vi.mocked(newsFeedRepo.findFollowedSubforumIds).mockResolvedValue([
      "sub-followed",
    ]);
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-followed",
        subforum: { id: "sub-followed", name: "Robotics", isApproved: true },
        createdAt: new Date("2026-11-09T10:00:00Z"),
      }),
    ]);

    const followedResult = await getNewsFeed({
      userId: "user-1",
      userRole: "STUDENT",
      filter: "FOLLOWED",
    });

    expect(newsFeedRepo.listActiveFeedPosts).toHaveBeenCalledWith([
      "sub-followed",
    ]);
    expect(followedResult.success).toBe(true);
    if (!followedResult.success || !followedResult.data) return;
    expect(followedResult.data.items.map((item) => item.id)).toEqual([
      "post-followed",
    ]);
  });

  it("sorts posts by MOST_UPVOTED net score descending with tie-breaking", async () => {
    const older = new Date("2026-11-08T10:00:00Z");
    const newer = new Date("2026-11-09T10:00:00Z");

    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-low",
        createdAt: newer,
        votes: [
          { userId: "u1", type: "UPVOTE" },
          { userId: "u2", type: "DOWNVOTE" },
          { userId: "u3", type: "DOWNVOTE" },
        ],
      }),
      makePost({
        id: "post-top",
        createdAt: older,
        votes: [
          { userId: "u1", type: "UPVOTE" },
          { userId: "u2", type: "UPVOTE" },
          { userId: "u3", type: "UPVOTE" },
        ],
      }),
      makePost({
        id: "post-tie-newer",
        createdAt: newer,
        votes: [{ userId: "u1", type: "UPVOTE" }],
      }),
      makePost({
        id: "post-tie-older",
        createdAt: older,
        votes: [{ userId: "u1", type: "UPVOTE" }],
      }),
    ]);

    const result = await getNewsFeed({
      userId: "u1",
      userRole: "STUDENT",
      filter: "DISCUSSIONS",
      sort: "MOST_UPVOTED",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.items.map((item) => item.id)).toEqual([
      "post-top",
      "post-tie-newer",
      "post-tie-older",
      "post-low",
    ]);
  });

  it("keeps URGENT and HIGH announcements pinned above scored posts in ALL + MOST_UPVOTED", async () => {
    const t1 = new Date("2026-11-09T09:00:00Z");
    const t2 = new Date("2026-11-09T10:00:00Z");

    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-popular",
        createdAt: t1,
        votes: [
          { userId: "u1", type: "UPVOTE" },
          { userId: "u2", type: "UPVOTE" },
        ],
      }),
      makePost({
        id: "post-unpopular",
        createdAt: t2,
        votes: [],
      }),
    ]);
    vi.mocked(newsFeedRepo.listActiveFeedAnnouncements).mockResolvedValue([
      makeAnnouncement({
        id: "ann-medium",
        priority: "MEDIUM",
        createdAt: t2,
      }),
      makeAnnouncement({
        id: "ann-high",
        priority: "HIGH",
        createdAt: t1,
      }),
    ]);

    const result = await getNewsFeed({
      userId: "u1",
      userRole: "STUDENT",
      filter: "ALL",
      sort: "MOST_UPVOTED",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    expect(result.data.items.map((item) => item.id)).toEqual([
      "ann-high",
      "post-popular",
      "post-unpopular",
      "ann-medium",
    ]);
  });

  it("masks deleted authors and truncates long excerpts", async () => {
    const longText = "A".repeat(250);
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({
        id: "post-long",
        content: longText,
        createdAt: new Date("2026-11-09T10:00:00Z"),
        author: { id: "u-del", name: "Secret Name", isDeleted: true },
      }),
    ]);

    const result = await getNewsFeed({
      userId: "viewer-1",
      userRole: "STUDENT",
      filter: "DISCUSSIONS",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) return;

    const item = result.data.items[0];
    expect(item.kind).toBe("POST");
    if (item.kind !== "POST") return;
    expect(item.author.name).toBe("Deleted user");
    expect(item.excerpt.length).toBeLessThanOrEqual(201);
    expect(item.excerpt.endsWith("…")).toBe(true);
  });

  it("paginates feed items deterministically and sets hasMore and nextPage", async () => {
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockResolvedValue([
      makePost({ id: "p1", createdAt: new Date("2026-11-09T12:00:00Z") }),
      makePost({ id: "p2", createdAt: new Date("2026-11-09T11:00:00Z") }),
      makePost({ id: "p3", createdAt: new Date("2026-11-09T10:00:00Z") }),
    ]);

    const page1 = await getNewsFeed({
      userId: "u1",
      userRole: "STUDENT",
      filter: "DISCUSSIONS",
      page: 1,
      pageSize: 2,
    });

    expect(page1).toMatchObject({
      success: true,
      data: {
        page: 1,
        pageSize: 2,
        hasMore: true,
        nextPage: 2,
        totalCount: 3,
      },
    });
    if (page1.success && page1.data) {
      expect(page1.data.items.map((item) => item.id)).toEqual(["p1", "p2"]);
    }

    const page2 = await getNewsFeed({
      userId: "u1",
      userRole: "STUDENT",
      filter: "DISCUSSIONS",
      page: 2,
      pageSize: 2,
    });

    expect(page2).toMatchObject({
      success: true,
      data: {
        page: 2,
        pageSize: 2,
        hasMore: false,
        nextPage: null,
        totalCount: 3,
      },
    });
    if (page2.success && page2.data) {
      expect(page2.data.items.map((item) => item.id)).toEqual(["p3"]);
    }
  });

  it("returns user-facing error message when fetching feed items fails", async () => {
    vi.mocked(newsFeedRepo.listActiveFeedPosts).mockRejectedValue(
      new Error("DB connection lost"),
    );

    const result = await getNewsFeed({
      userId: "u1",
      userRole: "STUDENT",
    });

    expect(result).toEqual({
      message: "Unable to load feed items. Please refresh.",
    });
  });
});
