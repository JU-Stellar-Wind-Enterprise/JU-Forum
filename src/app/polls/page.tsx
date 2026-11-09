import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { PollCard } from "@/components/poll/PollCard";
import { getCurrentUser } from "@/lib/session";
import {
  listApprovedPolls,
  listPendingPollRequests,
} from "@/services/poll.service";

export default async function PollsPage({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const isModeratorRole =
    user?.role === "ADMIN" ||
    user?.role === "SYSTEM_ADMIN" ||
    user?.role === "MODERATOR";

  const polls = await listApprovedPolls(undefined, user?.id);
  const pendingRequests = isModeratorRole
    ? await listPendingPollRequests()
    : [];

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community Polls</h1>
          <p className="mt-1 text-sm text-slate-600">
            Participate in campus opinions, voting, and student feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isModeratorRole && pendingRequests.length > 0 && (
            <Link
              href="/polls/pending"
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Review Requests ({pendingRequests.length})
            </Link>
          )}

          {user && (
            <Link
              href="/poll-request"
              className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
            >
              Propose Poll
            </Link>
          )}
        </div>
      </div>

      {params?.submitted && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          <span className="font-semibold">Success!</span> Your poll request has
          been submitted for moderator review. It will become visible once
          approved.
        </div>
      )}

      <div className="space-y-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            currentUserId={user?.id}
            currentUserRole={user?.role}
          />
        ))}

        {polls.length === 0 && (
          <div className="rounded-xl border border-dashed border-sky-200 bg-white/70 p-12 text-center text-slate-500">
            <p className="text-base font-medium text-slate-700">
              No active community polls yet.
            </p>
            <p className="mt-1 text-sm">
              Be the first to propose a discussion poll for the university!
            </p>
            {user ? (
              <Link
                href="/poll-request"
                className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Create Poll Request
              </Link>
            ) : (
              <Link
                href="/login"
                className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Sign in to Propose
              </Link>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
