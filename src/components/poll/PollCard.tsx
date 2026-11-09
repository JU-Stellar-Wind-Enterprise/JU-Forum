import { closePollAction, votePollAction } from "@/actions/poll.actions";
import type { PollWithResults } from "@/services/poll.service";

/**
 * Renders an interactive poll card with real-time percentage bars, voting controls, and status badges.
 *
 * @param props - The enriched poll data, current user ID and role, and permission flags.
 * @returns An accessible card displaying poll options, vote percentages, and moderation actions.
 */
export function PollCard({
  poll,
  currentUserId,
  currentUserRole,
  isModerator = false,
}: {
  poll: PollWithResults;
  currentUserId?: string;
  currentUserRole?: string;
  isModerator?: boolean;
}) {
  const isExpired =
    poll.expiresAt !== null && new Date(poll.expiresAt) <= new Date();
  const isVotingDisabled = poll.isClosed || isExpired;
  const hasUserVoted = Boolean(poll.userVotedOptionId);

  const canClose =
    !poll.isClosed &&
    Boolean(
      currentUserId &&
        (poll.authorId === currentUserId ||
          currentUserRole === "ADMIN" ||
          currentUserRole === "SYSTEM_ADMIN" ||
          currentUserRole === "MODERATOR" ||
          isModerator),
    );

  return (
    <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {poll.subforum && (
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              {poll.subforum.name}
            </span>
          )}
          {poll.isClosed ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Closed
            </span>
          ) : isExpired ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Expired
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Active Poll
            </span>
          )}
        </div>

        {canClose && (
          <form action={closePollAction}>
            <input type="hidden" name="pollId" value={poll.id} />
            <button
              type="submit"
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Close poll
            </button>
          </form>
        )}
      </div>

      <h2 className="mt-3 text-xl font-bold text-slate-900">{poll.question}</h2>
      {poll.description && (
        <p className="mt-1.5 text-sm text-slate-600">{poll.description}</p>
      )}

      <div className="mt-5 space-y-3">
        {poll.options.map((option) => {
          const isUserChoice = poll.userVotedOptionId === option.id;
          return (
            <div
              key={option.id}
              className={`relative overflow-hidden rounded-lg border p-3 transition-colors ${
                isUserChoice
                  ? "border-sky-400 bg-sky-50/50"
                  : "border-slate-200 bg-slate-50/30"
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                  isUserChoice ? "bg-sky-200/50" : "bg-slate-200/50"
                }`}
                style={{ width: `${option.percentage}%` }}
              />

              <div className="relative flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  {option.text}
                  {isUserChoice && (
                    <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Your vote
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">
                    {option.percentage}% ({option.voteCount}{" "}
                    {option.voteCount === 1 ? "vote" : "votes"})
                  </span>

                  {!isVotingDisabled && !hasUserVoted && currentUserId && (
                    <form action={votePollAction}>
                      <input type="hidden" name="pollId" value={poll.id} />
                      <input type="hidden" name="optionId" value={option.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        Vote
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>
          Total votes: <span className="font-semibold">{poll.totalVotes}</span>
          {poll.author && ` · Proposed by ${poll.author.name}`}
        </div>
        {poll.expiresAt && (
          <div>
            {isExpired ? "Closed on: " : "Closes: "}
            {new Date(poll.expiresAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {isVotingDisabled && (
        <p className="mt-3 text-xs italic text-amber-700">
          This poll is closed and no longer accepting votes.
        </p>
      )}
      {!currentUserId && !isVotingDisabled && (
        <p className="mt-3 text-xs text-slate-500">
          Please{" "}
          <a href="/login" className="font-medium text-sky-600 underline">
            sign in
          </a>{" "}
          to cast your vote.
        </p>
      )}
    </div>
  );
}
