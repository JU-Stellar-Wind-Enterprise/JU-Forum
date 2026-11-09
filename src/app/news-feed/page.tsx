import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { NewsFeedClient } from "@/components/news-feed/NewsFeedClient";
import { getCurrentUser } from "@/lib/session";
import { getNewsFeed } from "@/services/news-feed.service";
import type { FeedFilter, FeedSort } from "@/types/news-feed";

const VALID_FILTERS = new Set<FeedFilter>([
  "ALL",
  "DISCUSSIONS",
  "FOLLOWED",
  "ANNOUNCEMENTS",
]);

const VALID_SORTS = new Set<FeedSort>(["LATEST", "MOST_UPVOTED"]);

function parseFilter(value?: string): FeedFilter {
  return VALID_FILTERS.has(value as FeedFilter) ? (value as FeedFilter) : "ALL";
}

function parseSort(value?: string): FeedSort {
  return VALID_SORTS.has(value as FeedSort) ? (value as FeedSort) : "LATEST";
}

export default async function NewsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const initialFilter = parseFilter(resolvedParams.filter);
  const initialSort = parseSort(resolvedParams.sort);

  const feedResult = await getNewsFeed({
    userId: user.id,
    userRole: user.role,
    filter: initialFilter,
    sort: initialSort,
    page: 1,
    pageSize: 10,
  });

  return (
    <PageShell>
      <header className="mb-6 flex flex-col gap-4 rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-600">JU Forum</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">News Feed</h1>
          <p className="mt-1 text-sm text-slate-600">
            Recent discussions, followed subforum updates, and campus
            announcements.
          </p>
        </div>
        <nav
          aria-label="Feed navigation"
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/"
            className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            href="/subforum"
            className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Subforums
          </Link>
          <Link
            href="/announcement"
            className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Announcements
          </Link>
          <Link
            href="/post/create"
            className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Create post
          </Link>
        </nav>
      </header>

      <NewsFeedClient
        initialFeed={feedResult.success ? (feedResult.data ?? null) : null}
        initialError={feedResult.success ? undefined : feedResult.message}
        initialFilter={initialFilter}
        initialSort={initialSort}
        canVote={user.status === "ACTIVE"}
      />
    </PageShell>
  );
}
