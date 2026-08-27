import { voteAction } from "@/actions/vote.actions";
import type { VoteType } from "@/generated/prisma/client";

/** Renders post vote controls and their current totals. */
export function VoteButtons({
  postId,
  upvotes,
  downvotes,
  currentVote,
  disabled,
}: {
  postId: string;
  upvotes: number;
  downvotes: number;
  currentVote: VoteType | null;
  disabled: boolean;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <form action={voteAction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="type" value="UPVOTE" />
        <button
          type="submit"
          disabled={disabled}
          aria-pressed={currentVote === "UPVOTE"}
          className="rounded border px-3 py-2 aria-pressed:bg-green-100 disabled:opacity-50"
        >
          Upvote {upvotes}
        </button>
      </form>
      <form action={voteAction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="type" value="DOWNVOTE" />
        <button
          type="submit"
          disabled={disabled}
          aria-pressed={currentVote === "DOWNVOTE"}
          className="rounded border px-3 py-2 aria-pressed:bg-red-100 disabled:opacity-50"
        >
          Downvote {downvotes}
        </button>
      </form>
    </div>
  );
}