"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  loadNewsFeedAction,
  voteFeedPostAction,
} from "@/actions/news-feed.actions";
import type { VoteType } from "@/generated/prisma/client";
import type {
  FeedFilter,
  FeedItem,
  FeedSort,
  FeedVoteSummary,
  NewsFeedPage,
} from "@/types/news-feed";
import type { ActionResult } from "@/types/result";
import { AnnouncementFeedCard } from "./AnnouncementFeedCard";
import { PostFeedCard } from "./PostFeedCard";

const FILTER_TABS: { value: FeedFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DISCUSSIONS", label: "Discussions" },
  { value: "FOLLOWED", label: "Followed" },
  { value: "ANNOUNCEMENTS", label: "Announcements" },
];

const SORT_OPTIONS: { value: FeedSort; label: string }[] = [
  { value: "LATEST", label: "Latest" },
  { value: "MOST_UPVOTED", label: "Most Upvoted" },
];

type LoadFeedFn = (input: {
  filter: FeedFilter;
  sort: FeedSort;
  page: number;
}) => Promise<ActionResult<NewsFeedPage>>;

type VoteFeedPostFn = (input: {
  postId: string;
  type: VoteType;
}) => Promise<ActionResult<FeedVoteSummary>>;

function syncUrlQuery(filter: FeedFilter, sort: FeedSort) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (filter !== "ALL") params.set("filter", filter);
  if (sort !== "LATEST") params.set("sort", sort);
  const query = params.toString();
  const nextUrl = query ? `/news-feed?${query}` : "/news-feed";
  window.history.replaceState(null, "", nextUrl);
}

function mergeUniqueFeedItems(
  existing: FeedItem[],
  incoming: FeedItem[],
): FeedItem[] {
  const seen = new Set(existing.map((item) => `${item.kind}:${item.id}`));
  const uniqueIncoming = incoming.filter(
    (item) => !seen.has(`${item.kind}:${item.id}`),
  );
  return [...existing, ...uniqueIncoming];
}

/**
 * Interactive news feed controller supporting filtering, sorting, continuous loading, and inline voting.
 *
 * @param props - Initial server-fetched feed slice, initial query params, voting permission, and optional action overrides.
 * @returns The interactive feed toolbar, item list, error states, and Load More controls.
 */
export function NewsFeedClient({
  initialFeed,
  initialError,
  initialFilter,
  initialSort,
  canVote,
  loadFeed = loadNewsFeedAction,
  votePost = voteFeedPostAction,
}: {
  initialFeed: NewsFeedPage | null;
  initialError?: string;
  initialFilter: FeedFilter;
  initialSort: FeedSort;
  canVote: boolean;
  loadFeed?: LoadFeedFn;
  votePost?: VoteFeedPostFn;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialFeed?.items ?? []);
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [hasMore, setHasMore] = useState<boolean>(
    initialFeed?.hasMore ?? false,
  );
  const [nextPage, setNextPage] = useState<number | null>(
    initialFeed?.nextPage ?? null,
  );
  const [totalCount, setTotalCount] = useState<number>(
    initialFeed?.totalCount ?? 0,
  );
  const [followedSubforumCount, setFollowedSubforumCount] = useState<number>(
    initialFeed?.followedSubforumCount ?? 0,
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isRefreshing, startRefreshing] = useTransition();
  const [isLoadingMore, startLoadingMore] = useTransition();

  function applyPageData(data: NewsFeedPage, append: boolean) {
    setItems((prev) =>
      append ? mergeUniqueFeedItems(prev, data.items) : data.items,
    );
    setHasMore(data.hasMore);
    setNextPage(data.nextPage);
    setTotalCount(data.totalCount);
    setFollowedSubforumCount(data.followedSubforumCount);
    setError(null);
  }

  function fetchFeed(nextFilter: FeedFilter, nextSort: FeedSort) {
    setError(null);
    setVoteError(null);
    setFilter(nextFilter);
    setSort(nextSort);
    syncUrlQuery(nextFilter, nextSort);

    startRefreshing(async () => {
      try {
        const result = await loadFeed({
          filter: nextFilter,
          sort: nextSort,
          page: 1,
        });
        if (!result.success || !result.data) {
          setError(
            result.message || "Unable to load feed items. Please refresh.",
          );
          return;
        }
        applyPageData(result.data, false);
      } catch {
        setError("Unable to load feed items. Please refresh.");
      }
    });
  }

  function handleLoadMore() {
    if (!hasMore || !nextPage || isLoadingMore) return;
    setError(null);
    const targetPage = nextPage;

    startLoadingMore(async () => {
      try {
        const result = await loadFeed({
          filter,
          sort,
          page: targetPage,
        });
        if (!result.success || !result.data) {
          setError(
            result.message || "Unable to load feed items. Please refresh.",
          );
          return;
        }
        applyPageData(result.data, true);
      } catch {
        setError("Unable to load feed items. Please refresh.");
      }
    });
  }

  async function handleVote(postId: string, type: VoteType) {
    setVoteError(null);
    try {
      const result = await votePost({ postId, type });
      if (!result.success || !result.data) {
        setVoteError(
          result.message || "Unable to update vote. Please try again.",
        );
        return;
      }
      const summary = result.data;
      setItems((prev) =>
        prev.map((entry) =>
          entry.kind === "POST" && entry.id === postId
            ? {
                ...entry,
                upvotes: summary.upvotes,
                downvotes: summary.downvotes,
                score: summary.score,
                currentVote: summary.currentVote,
              }
            : entry,
        ),
      );
    } catch {
      setVoteError("Unable to update vote. Please try again.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Feed filters"
        >
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isRefreshing}
                onClick={() => fetchFeed(tab.value, sort)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50"
                }`}
              >
                {tab.label}
                {tab.value === "FOLLOWED" ? ` (${followedSubforumCount})` : ""}
              </button>
            );
          })}
        </div>

        <fieldset
          className="flex items-center gap-2 border-0 p-0"
          aria-label="Sort feed"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sort
          </span>
          {SORT_OPTIONS.map((option) => {
            const active = sort === option.value;
            const disabled = filter === "ANNOUNCEMENTS" || isRefreshing;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => fetchFeed(filter, option.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "border-sky-300 bg-sky-50 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      {!canVote && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Voting is disabled because your account is not currently active.
        </p>
      )}

      {voteError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {voteError}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchFeed(filter, sort)}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Refresh
          </button>
        </div>
      )}

      {isRefreshing && (
        <p className="text-sm text-slate-500" aria-live="polite">
          Updating feed…
        </p>
      )}

      {!error && items.length === 0 && !isRefreshing && (
        <div className="rounded-lg border border-dashed border-sky-200 bg-white/80 p-8 text-center">
          {filter === "FOLLOWED" && followedSubforumCount === 0 ? (
            <div className="space-y-3">
              <p className="text-slate-600">
                You are not following any subforums yet.
              </p>
              <Link
                href="/subforum"
                className="inline-block rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Browse subforums to follow
              </Link>
            </div>
          ) : (
            <p className="text-slate-500">
              No feed items match the selected filter yet.
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) =>
          item.kind === "ANNOUNCEMENT" ? (
            <AnnouncementFeedCard key={`announcement-${item.id}`} item={item} />
          ) : (
            <PostFeedCard
              key={`post-${item.id}`}
              item={item}
              canVote={canVote}
              onVote={handleVote}
            />
          ),
        )}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isLoadingMore || isRefreshing}
            onClick={handleLoadMore}
            className="rounded-md border border-sky-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-600 shadow-sm hover:bg-sky-50 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
          <p className="text-xs text-slate-500">
            Showing {items.length} of {totalCount} items
          </p>
        </div>
      )}
    </div>
  );
}
