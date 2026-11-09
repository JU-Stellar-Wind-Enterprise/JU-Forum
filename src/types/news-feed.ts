import type {
  PriorityLevel,
  TargetAudience,
  UserRole,
  VoteType,
} from "@/generated/prisma/client";

/**
 * Filter categories supported on the personalized news feed.
 */
export type FeedFilter = "ALL" | "DISCUSSIONS" | "FOLLOWED" | "ANNOUNCEMENTS";

/**
 * Sort orders supported on the personalized news feed.
 */
export type FeedSort = "LATEST" | "MOST_UPVOTED";

/**
 * Serializable summary of an active discussion post shown in the news feed.
 */
export type PostFeedItem = {
  kind: "POST";
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  subforum: {
    id: string;
    name: string;
  };
  upvotes: number;
  downvotes: number;
  score: number;
  currentVote: VoteType | null;
  commentCount: number;
  isLocked: boolean;
};

/**
 * Serializable summary of an active announcement shown in the news feed.
 */
export type AnnouncementFeedItem = {
  kind: "ANNOUNCEMENT";
  id: string;
  title: string;
  excerpt: string;
  priority: PriorityLevel;
  targetAudience: TargetAudience;
  createdAt: string;
  expiresAt: string | null;
  author: {
    id: string;
    name: string;
    role: UserRole;
  };
  isPinned: boolean;
};

/**
 * Union of all item types displayed in the unified news feed.
 */
export type FeedItem = PostFeedItem | AnnouncementFeedItem;

/**
 * Paginated news feed response returned by the feed service and load-more action.
 */
export type NewsFeedPage = {
  items: FeedItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage: number | null;
  totalCount: number;
  followedSubforumCount: number;
};

/**
 * Serializable vote summary returned after casting or toggling a post vote.
 */
export type FeedVoteSummary = {
  upvotes: number;
  downvotes: number;
  score: number;
  currentVote: VoteType | null;
};
