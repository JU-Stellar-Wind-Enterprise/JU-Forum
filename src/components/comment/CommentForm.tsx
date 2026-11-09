"use client";

import { useActionState, useState } from "react";
import {
  type CommentFormAction,
  invokeCommentAction,
} from "@/components/comment/comment-action-helpers";
import type { ActionResult } from "@/types/result";

/**
 * Renders a comment composer for creating, replying to, or editing a comment.
 *
 * @param props - Action handler, post/parent/comment identifiers, and UI state callbacks.
 * @returns A client form with character counting, validation feedback, and pending state.
 */
export function CommentForm<T = undefined>({
  postId,
  action,
  parentId,
  commentId,
  initialContent = "",
  placeholder = "Write a comment...",
  submitLabel = "Post comment",
  pendingLabel = "Posting…",
  disabled = false,
  onSuccess,
  onCancel,
}: {
  postId: string;
  action: CommentFormAction<T>;
  parentId?: string;
  commentId?: string;
  initialContent?: string;
  placeholder?: string;
  submitLabel?: string;
  pendingLabel?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, formAction, pending] = useActionState<
    ActionResult<T> | undefined,
    FormData
  >(async (prev, formData) => {
    const submitted = String(formData.get("content") || "");
    if (!submitted.trim()) {
      return { message: "Comment cannot be empty." };
    }
    if (submitted.trim().length > 2000) {
      return { message: "Comment must be 2,000 characters or less." };
    }

    const result = await invokeCommentAction(
      action,
      prev,
      formData,
      commentId
        ? "Unable to update comment. Please try again."
        : "Unable to post comment. Please try again.",
    );
    if (result?.success) {
      if (!commentId) setContent("");
      onSuccess?.();
    }
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {commentId && <input type="hidden" name="commentId" value={commentId} />}

      <textarea
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={2000}
        rows={parentId || commentId ? 3 : 4}
        disabled={disabled || pending}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

      {state?.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{content.length}/2000</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={disabled || pending}
            className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
