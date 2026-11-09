"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import type { VoteType } from "@/generated/prisma/client";
import type { PostFeedItem } from "@/types/news-feed";
import { formatFeedDate } from "./formatDate";

type VoteSnapshot = {
  upvotes: number;
  downvotes: number;
  score: number;
  currentVote: VoteType | null;
};

function computeNextVoteSnapshot(
  current: VoteSnapshot,
  clicked: VoteType,
): VoteSnapshot {
  let { upvotes, downvotes } = current;
  let nextVote: VoteType | null = clicked;

  if (current.currentVote === clicked) {
    nextVote = null;
    if (clicked === "UPVOTE") upvotes -= 1;
    else downvotes -= 1;
  } else {
    if (current.currentVote === "UPVOTE") upvotes -= 1;
    if (current.currentVote === "DOWNVOTE") downvotes -= 1;
    if (clicked === "UPVOTE") upvotes += 1;
    else downvotes += 1;
  }

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    currentVote: nextVote,
  };
}

/**
 * Renders a discussion post card with subforum badge, comment summary, and optimistic inline voting.
 *
 * @param props - Post feed item, voting permission flag, and async vote handler.
 * @returns An accessible article card summarizing a forum discussion thread.
 */
export function PostFeedCard({
  item,
  canVote,
  onVote,
}: {
  item: PostFeedItem;
  canVote: boolean;
  onVote: (postId: string, type: VoteType) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticVote, applyOptimisticVote] = useOptimistic<
    VoteSnapshot,
    VoteType
  >(
    {
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      score: item.score,
      currentVote: item.currentVote,
    },
    computeNextVoteSnapshot,
  );

  const votingDisabled = !canVote || item.isLocked || isPending;

  function handleVote(type: VoteType) {
    if (votingDisabled) return;
    startTransition(async () => {
      applyOptimisticVote(type);
      await onVote(item.id, type);
    });
  }

  return (
    <article className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm transition-colors hover:border-sky-200">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/subforum/${item.subforum.id}`}
            className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 hover:bg-sky-100"
          >
            {item.subforum.name}
          </Link>
          {item.isLocked && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              Locked
            </span>
          )}
        </div>
        <time dateTime={item.createdAt} className="text-slate-500">
          {formatFeedDate(item.createdAt)}
        </time>
      </div>

      <h2 className="mt-3 text-lg font-semibold text-slate-900">
        <Link
          href={`/post/${item.id}`}
          className="hover:text-blue-600 hover:underline"
        >
          {item.title}
        </Link>
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {item.excerpt}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={votingDisabled}
            aria-pressed={optimisticVote.currentVote === "UPVOTE"}
            onClick={() => handleVote("UPVOTE")}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-sky-50 aria-pressed:border-green-300 aria-pressed:bg-green-100 aria-pressed:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upvote {optimisticVote.upvotes}
          </button>
          <span className="px-1 text-xs font-semibold text-slate-700">
            Score {optimisticVote.score}
          </span>
          <button
            type="button"
            disabled={votingDisabled}
            aria-pressed={optimisticVote.currentVote === "DOWNVOTE"}
            onClick={() => handleVote("DOWNVOTE")}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-sky-50 aria-pressed:border-red-300 aria-pressed:bg-red-100 aria-pressed:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Downvote {optimisticVote.downvotes}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>By {item.author.name}</span>
          <span>
            {item.commentCount}{" "}
            {item.commentCount === 1 ? "comment" : "comments"}
          </span>
          <Link
            href={`/post/${item.id}`}
            className="font-medium text-blue-600 hover:underline"
          >
            Open thread →
          </Link>
        </div>
      </div>
    </article>
  );
}
