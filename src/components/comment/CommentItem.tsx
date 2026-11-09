"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CommentForm } from "@/components/comment/CommentForm";
import {
  type CommentFormAction,
  invokeCommentAction,
} from "@/components/comment/comment-action-helpers";
import type { AccountStatus, UserRole } from "@/generated/prisma/client";
import type { CommentNode } from "@/services/comment.service";
import type { ActionResult } from "@/types/result";

const ROLE_BADGE_MAP: Record<UserRole, { label: string; className: string }> = {
  STUDENT: {
    label: "Student",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  FACULTY: {
    label: "Faculty",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  STAFF: {
    label: "Staff",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  MODERATOR: {
    label: "Moderator",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  ADMIN: {
    label: "Admin",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  SYSTEM_ADMIN: {
    label: "System Admin",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Renders a single comment node with role badge, voting controls, inline reply/edit/delete, and nested replies.
 *
 * @param props - The comment node, viewer permissions, thread lock state, and Server Actions.
 * @returns A comment card with nested child comment threads.
 */
export function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserStatus,
  canModerate,
  isClosed,
  createAction,
  editAction,
  deleteAction,
  voteAction,
  depth = 0,
}: {
  comment: CommentNode;
  postId: string;
  currentUserId: string;
  currentUserStatus: AccountStatus;
  canModerate: boolean;
  isClosed: boolean;
  createAction: CommentFormAction<{ id: string }>;
  editAction: CommentFormAction;
  deleteAction: CommentFormAction;
  voteAction: CommentFormAction;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [voteState, voteFormAction, votePending] = useActionState<
    ActionResult | undefined,
    FormData
  >(
    (prev, formData) =>
      invokeCommentAction(
        voteAction,
        prev,
        formData,
        "Unable to record vote. Please try again.",
      ),
    undefined,
  );

  const [deleteState, deleteFormAction, deletePending] = useActionState<
    ActionResult | undefined,
    FormData
  >(async (prev, formData) => {
    const result = await invokeCommentAction(
      deleteAction,
      prev,
      formData,
      "Unable to delete comment. Please try again.",
    );
    if (result?.success) setConfirmDelete(false);
    return result;
  }, undefined);

  const isActiveViewer = currentUserStatus === "ACTIVE";
  const isAuthor = comment.author?.id === currentUserId;
  const canDelete = (isAuthor || canModerate) && isActiveViewer;
  const canEdit = isAuthor && !isClosed && isActiveViewer;
  const canReply = !isClosed && isActiveViewer;
  const votingDisabled = isClosed || !isActiveViewer || votePending;
  const roleBadge = comment.author ? ROLE_BADGE_MAP[comment.author.role] : null;
  const createdAtDate = new Date(comment.createdAt);

  return (
    <div
      className={
        depth > 0
          ? depth <= 4
            ? "mt-3 border-l-2 border-sky-100 pl-3 sm:pl-5"
            : "mt-3 border-l-2 border-sky-100 pl-2"
          : ""
      }
    >
      <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
        {comment.isDeleted ? (
          <p className="text-sm italic text-slate-500">[deleted]</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                {comment.author ? (
                  <Link
                    href={`/profile/${comment.author.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {comment.author.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">Unknown</span>
                )}
                {roleBadge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleBadge.className}`}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <time
                  dateTime={createdAtDate.toISOString()}
                  suppressHydrationWarning
                >
                  {dateFormatter.format(createdAtDate)}
                </time>
                {comment.isEdited && (
                  <span className="text-slate-400">(edited)</span>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3">
                <CommentForm
                  postId={postId}
                  commentId={comment.id}
                  initialContent={comment.content}
                  action={editAction}
                  submitLabel="Save"
                  pendingLabel="Saving…"
                  placeholder="Edit your comment..."
                  onSuccess={() => setIsEditing(false)}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {comment.content}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <form action={voteFormAction}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="postId" value={postId} />
                  <input type="hidden" name="type" value="UPVOTE" />
                  <button
                    type="submit"
                    disabled={votingDisabled}
                    aria-pressed={comment.currentVote === "UPVOTE"}
                    className="rounded border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-sky-300 aria-pressed:border-green-300 aria-pressed:bg-green-100 aria-pressed:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upvote ({comment.upvotes})
                  </button>
                </form>

                <span
                  className="px-1 font-semibold text-slate-600"
                  title={`Score: ${comment.score}`}
                >
                  {comment.score}
                </span>

                <form action={voteFormAction}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="postId" value={postId} />
                  <input type="hidden" name="type" value="DOWNVOTE" />
                  <button
                    type="submit"
                    disabled={votingDisabled}
                    aria-pressed={comment.currentVote === "DOWNVOTE"}
                    className="rounded border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-sky-300 aria-pressed:border-red-300 aria-pressed:bg-red-100 aria-pressed:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Downvote ({comment.downvotes})
                  </button>
                </form>
              </div>

              {canReply && (
                <button
                  type="button"
                  onClick={() => {
                    setIsReplying((prev) => !prev);
                    setIsEditing(false);
                  }}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Reply
                </button>
              )}

              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsReplying(false);
                  }}
                  className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Edit
                </button>
              )}

              {canDelete && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}

              {canDelete && confirmDelete && (
                <form
                  action={deleteFormAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="postId" value={postId} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletePending ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deletePending}
                    className="font-medium text-slate-500 hover:underline"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>

            {voteState?.message && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {voteState.message}
              </p>
            )}
            {deleteState?.message && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {deleteState.message}
              </p>
            )}

            {isReplying && canReply && (
              <div className="mt-3 rounded-md border border-sky-100 bg-white p-3">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  action={createAction}
                  submitLabel="Post reply"
                  pendingLabel="Replying…"
                  placeholder={`Reply to ${comment.author?.name ?? "comment"}...`}
                  onSuccess={() => setIsReplying(false)}
                  onCancel={() => setIsReplying(false)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              currentUserStatus={currentUserStatus}
              canModerate={canModerate}
              isClosed={isClosed}
              createAction={createAction}
              editAction={editAction}
              deleteAction={deleteAction}
              voteAction={voteAction}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
