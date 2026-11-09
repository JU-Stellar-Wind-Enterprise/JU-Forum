import type {
  PriorityLevel,
  TargetAudience,
  UserRole,
  VoteType,
} from "@/generated/prisma/client";
import * as newsFeedRepo from "@/repositories/news-feed.repository";
import type {
  AnnouncementFeedItem,
  FeedFilter,
  FeedItem,
  FeedSort,
  NewsFeedPage,
  PostFeedItem,
} from "@/types/news-feed";
import type { ActionResult } from "@/types/result";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const EXCERPT_MAX_LENGTH = 200;

const VALID_FILTERS = new Set<FeedFilter>([
  "ALL",
  "DISCUSSIONS",
  "FOLLOWED",
  "ANNOUNCEMENTS",
]);

const VALID_SORTS = new Set<FeedSort>(["LATEST", "MOST_UPVOTED"]);

const ROLE_AUDIENCES: Record<UserRole, TargetAudience[]> = {
  STUDENT: ["ALL", "STUDENTS"],
  FACULTY: ["ALL", "FACULTY"],
  STAFF: ["ALL", "STAFF"],
  MODERATOR: ["ALL"],
  ADMIN: ["ALL"],
  SYSTEM_ADMIN: ["ALL"],
};

const PRIORITY_RANK: Record<PriorityLevel, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

type RawFeedPost = Awaited<
  ReturnType<typeof newsFeedRepo.listActiveFeedPosts>
>[number];

type RawFeedAnnouncement = Awaited<
  ReturnType<typeof newsFeedRepo.listActiveFeedAnnouncements>
>[number];

function normalizeFilter(value?: string): FeedFilter {
  return VALID_FILTERS.has(value as FeedFilter) ? (value as FeedFilter) : "ALL";
}

function normalizeSort(value?: string): FeedSort {
  return VALID_SORTS.has(value as FeedSort) ? (value as FeedSort) : "LATEST";
}

function normalizePage(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : 1;
}

function normalizePageSize(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function buildExcerpt(content: string): string {
  const collapsed = content.trim().replace(/\s+/g, " ");
  if (collapsed.length <= EXCERPT_MAX_LENGTH) return collapsed;
  return `${collapsed.slice(0, EXCERPT_MAX_LENGTH)}…`;
}

function mapPostToFeedItem(post: RawFeedPost, userId: string): PostFeedItem {
  let upvotes = 0;
  let downvotes = 0;
  let currentVote: VoteType | null = null;

  for (const vote of post.votes) {
    if (vote.type === "UPVOTE") upvotes += 1;
    else if (vote.type === "DOWNVOTE") downvotes += 1;
    if (vote.userId === userId) currentVote = vote.type;
  }

  return {
    kind: "POST",
    id: post.id,
    title: post.title,
    excerpt: buildExcerpt(post.content),
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.isDeleted ? "Deleted user" : post.author.name,
    },
    subforum: {
      id: post.subforum.id,
      name: post.subforum.name,
    },
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    currentVote,
    commentCount: post._count.comments,
    isLocked: post.isLocked,
  };
}

function mapAnnouncementToFeedItem(
  announcement: RawFeedAnnouncement,
): AnnouncementFeedItem {
  return {
    kind: "ANNOUNCEMENT",
    id: announcement.id,
    title: announcement.title,
    excerpt: buildExcerpt(announcement.content),
    priority: announcement.priority,
    targetAudience: announcement.targetAudience,
    createdAt: announcement.createdAt.toISOString(),
    expiresAt: announcement.expiresAt
      ? announcement.expiresAt.toISOString()
      : null,
    author: {
      id: announcement.author.id,
      name: announcement.author.name,
      role: announcement.author.role,
    },
    isPinned:
      announcement.priority === "URGENT" || announcement.priority === "HIGH",
  };
}

function compareByDateDesc(a: FeedItem, b: FeedItem): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function compareAnnouncementsByPriorityThenDate(
  a: AnnouncementFeedItem,
  b: AnnouncementFeedItem,
): number {
  const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  return priorityDiff !== 0 ? priorityDiff : compareByDateDesc(a, b);
}

function comparePostsByScoreDesc(a: PostFeedItem, b: PostFeedItem): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
  return compareByDateDesc(a, b);
}

function sortUnifiedItems(
  posts: PostFeedItem[],
  announcements: AnnouncementFeedItem[],
  filter: FeedFilter,
  sort: FeedSort,
): FeedItem[] {
  if (filter === "ANNOUNCEMENTS") {
    const pinned = announcements
      .filter((item) => item.isPinned)
      .sort(compareAnnouncementsByPriorityThenDate);
    const regular = announcements
      .filter((item) => !item.isPinned)
      .sort(compareByDateDesc);
    return [...pinned, ...regular];
  }

  if (filter === "DISCUSSIONS" || filter === "FOLLOWED") {
    return [...posts].sort(
      sort === "MOST_UPVOTED" ? comparePostsByScoreDesc : compareByDateDesc,
    );
  }

  const pinned = announcements
    .filter((item) => item.isPinned)
    .sort(compareAnnouncementsByPriorityThenDate);
  const regularAnnouncements = announcements.filter((item) => !item.isPinned);

  if (sort === "MOST_UPVOTED") {
    const sortedPosts = [...posts].sort(comparePostsByScoreDesc);
    const sortedRegularAnnouncements = [...regularAnnouncements].sort(
      compareAnnouncementsByPriorityThenDate,
    );
    return [...pinned, ...sortedPosts, ...sortedRegularAnnouncements];
  }

  const combinedUnpinned: FeedItem[] = [...posts, ...regularAnnouncements].sort(
    compareByDateDesc,
  );
  return [...pinned, ...combinedUnpinned];
}

/**
 * Builds a filtered, sorted, and paginated personalized news feed for an authenticated user.
 *
 * @param input - Viewer identity, role, and optional filter, sort, and pagination parameters.
 * @returns A serializable feed page, or a user-facing error message if loading fails.
 */
export async function getNewsFeed(input: {
  userId: string;
  userRole: UserRole;
  filter?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<NewsFeedPage>> {
  const userId = input.userId.trim();
  if (!userId) return { message: "You must be logged in." };

  const filter = normalizeFilter(input.filter);
  const sort = normalizeSort(input.sort);
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const audiences = ROLE_AUDIENCES[input.userRole] ?? ["ALL"];

  try {
    const followedSubforumIds =
      await newsFeedRepo.findFollowedSubforumIds(userId);

    if (filter === "FOLLOWED" && followedSubforumIds.length === 0) {
      return {
        success: true,
        data: {
          items: [],
          page,
          pageSize,
          hasMore: false,
          nextPage: null,
          totalCount: 0,
          followedSubforumCount: 0,
        },
      };
    }

    const shouldLoadPosts = filter !== "ANNOUNCEMENTS";
    const shouldLoadAnnouncements =
      filter === "ALL" || filter === "ANNOUNCEMENTS";

    const [rawPosts, rawAnnouncements] = await Promise.all([
      shouldLoadPosts
        ? newsFeedRepo.listActiveFeedPosts(
            filter === "FOLLOWED" ? followedSubforumIds : undefined,
          )
        : Promise.resolve([]),
      shouldLoadAnnouncements
        ? newsFeedRepo.listActiveFeedAnnouncements(audiences)
        : Promise.resolve([]),
    ]);

    const now = new Date();
    const activePosts = rawPosts
      .filter((post) => !post.isArchived && post.subforum.isApproved)
      .map((post) => mapPostToFeedItem(post, userId));

    const activeAnnouncements = rawAnnouncements
      .filter(
        (announcement) =>
          audiences.includes(announcement.targetAudience) &&
          (!announcement.expiresAt || announcement.expiresAt > now),
      )
      .map(mapAnnouncementToFeedItem);

    const orderedItems = sortUnifiedItems(
      activePosts,
      activeAnnouncements,
      filter,
      sort,
    );
    const totalCount = orderedItems.length;
    const offset = (page - 1) * pageSize;
    const pagedItems = orderedItems.slice(offset, offset + pageSize);
    const hasMore = offset + pagedItems.length < totalCount;

    return {
      success: true,
      data: {
        items: pagedItems,
        page,
        pageSize,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
        totalCount,
        followedSubforumCount: followedSubforumIds.length,
      },
    };
  } catch {
    return { message: "Unable to load feed items. Please refresh." };
  }
}
