import {
  createCommentAction,
  deleteCommentAction,
  editCommentAction,
  voteCommentAction,
} from "@/actions/comment.actions";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentItem } from "@/components/comment/CommentItem";
import type { AccountStatus } from "@/generated/prisma/client";
import type { CommentNode } from "@/services/comment.service";

/**
 * Renders the discussion comments section beneath a post, including composer and nested threads.
 *
 * @param props - Post metadata, comment tree, visible count, lock state, and viewer permissions.
 * @returns A styled comments panel with closed/inactive state notices and threaded replies.
 */
export function CommentSection({
  postId,
  comments,
  totalCount,
  isClosed,
  currentUserId,
  currentUserStatus,
  canModerate,
}: {
  postId: string;
  comments: CommentNode[];
  totalCount: number;
  isClosed: boolean;
  currentUserId: string;
  currentUserStatus: AccountStatus;
  canModerate: boolean;
}) {
  const isSuspendedOrInactive = currentUserStatus !== "ACTIVE";

  return (
    <section
      aria-labelledby="comments-heading"
      className="mt-6 rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="comments-heading" className="text-xl font-bold text-slate-900">
          Comments ({totalCount})
        </h2>
      </div>

      {isClosed ? (
        <div className="mb-6 space-y-3">
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Comments are closed for this post.
          </p>
          <CommentForm
            postId={postId}
            action={createCommentAction}
            disabled
            placeholder="Comments are closed for this post."
          />
        </div>
      ) : isSuspendedOrInactive ? (
        <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Your account is not active and cannot participate in discussions.
        </p>
      ) : (
        <div className="mb-6">
          <CommentForm postId={postId} action={createCommentAction} />
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              currentUserStatus={currentUserStatus}
              canModerate={canModerate}
              isClosed={isClosed}
              createAction={createCommentAction}
              editAction={editCommentAction}
              deleteAction={deleteCommentAction}
              voteAction={voteCommentAction}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-sky-200 p-6 text-center text-sm text-slate-500">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}
    </section>
  );
}
