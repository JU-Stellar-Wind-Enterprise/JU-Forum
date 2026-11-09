import {
  approvePollRequestAction,
  rejectPollRequestAction,
} from "@/actions/poll.actions";

interface PendingPollItem {
  id: string;
  question: string;
  description: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    role: string;
  };
  options: {
    id: string;
    text: string;
  }[];
  subforum?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Lists pending poll requests awaiting review by forum moderators and admins.
 *
 * @param props - Array of pending poll requests.
 * @returns Moderation cards with approval and rejection actions.
 */
export function PendingPollsList({ polls }: { polls: PendingPollItem[] }) {
  if (polls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sky-200 bg-white/70 p-8 text-center text-slate-500">
        No pending poll requests at this time.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <div
          key={poll.id}
          className="rounded-xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              Awaiting Approval
            </span>
            <span className="text-xs text-slate-500">
              Submitted: {new Date(poll.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-slate-900">
            {poll.question}
          </h3>
          {poll.description && (
            <p className="mt-1 text-sm text-slate-600">{poll.description}</p>
          )}

          <div className="mt-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500">
              Options Proposed:
            </h4>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
              {poll.options.map((opt) => (
                <li key={opt.id}>{opt.text}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div>
              Requested by:{" "}
              <span className="font-semibold">{poll.author.name}</span> (
              {poll.author.role})
              {poll.subforum && ` · Subforum: ${poll.subforum.name}`}
            </div>

            <div className="flex items-center gap-2">
              <form action={rejectPollRequestAction}>
                <input type="hidden" name="pollId" value={poll.id} />
                <button
                  type="submit"
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
              </form>

              <form action={approvePollRequestAction}>
                <input type="hidden" name="pollId" value={poll.id} />
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
                >
                  Approve & Publish
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
