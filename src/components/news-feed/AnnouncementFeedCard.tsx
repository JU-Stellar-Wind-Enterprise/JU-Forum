import Link from "next/link";
import type { PriorityLevel } from "@/generated/prisma/client";
import type { AnnouncementFeedItem } from "@/types/news-feed";
import { formatFeedDate } from "./formatDate";

const PRIORITY_BADGE_CLASS: Record<PriorityLevel, string> = {
  URGENT: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-amber-100 text-amber-800 border-amber-200",
  MEDIUM: "bg-sky-100 text-sky-800 border-sky-200",
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
};

/**
 * Renders an official campus announcement card within the unified news feed.
 *
 * @param props - The announcement feed item to display.
 * @returns A visually distinguished announcement card linking to the notice details.
 */
export function AnnouncementFeedCard({ item }: { item: AnnouncementFeedItem }) {
  return (
    <article
      className={`rounded-lg border p-5 shadow-sm ${
        item.isPinned
          ? "border-sky-300 bg-sky-50/70"
          : "border-sky-100 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {item.isPinned && (
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-white">
              Pinned
            </span>
          )}
          <span
            className={`rounded-full border px-2.5 py-0.5 font-medium ${PRIORITY_BADGE_CLASS[item.priority]}`}
          >
            {item.priority}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200">
            Announcement · {item.targetAudience}
          </span>
        </div>
        <time dateTime={item.createdAt} className="text-slate-500">
          {formatFeedDate(item.createdAt)}
        </time>
      </div>

      <h2 className="mt-3 text-lg font-semibold text-slate-900">
        <Link
          href={`/announcement/${item.id}`}
          className="hover:text-blue-600 hover:underline"
        >
          {item.title}
        </Link>
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {item.excerpt}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sky-100/80 pt-3 text-xs text-slate-500">
        <span>
          By {item.author.name} · {item.author.role}
        </span>
        <Link
          href={`/announcement/${item.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          Read announcement →
        </Link>
      </div>
    </article>
  );
}
