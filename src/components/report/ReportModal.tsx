"use client";

import { useActionState, useState } from "react";
import { submitReportAction } from "@/actions/report.actions";
import type { ActionResult } from "@/types/result";

interface ReportModalProps {
  postId?: string;
  commentId?: string;
  announcementId?: string;
  targetLabel?: string;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OFFENSIVE", label: "Offensive Content" },
  { value: "FALSE_INFORMATION", label: "False Information" },
  { value: "ACADEMIC_MISCONDUCT", label: "Academic Misconduct" },
  { value: "OTHER", label: "Other" },
];

/**
 * ReportModal component provides a modal interface for users to report content
 * to platform moderators with structured reasons and remarks.
 */
export function ReportModal({
  postId,
  commentId,
  announcementId,
  targetLabel = "content",
}: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: ActionResult<{ id: string }> | undefined,
      formData: FormData,
    ) => {
      const res = await submitReportAction(prevState, formData);
      return res;
    },
    undefined,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
        aria-label={`Report this ${targetLabel}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.331c1.554-.311 3.109.28 4.606.879 1.487.595 2.97.944 4.502.64l2.128-.426A.75.75 0 0 0 17 13.39V4.283a.75.75 0 0 0-.898-.735l-2.128.426c-1.22.244-2.434-.04-3.847-.605-1.516-.607-3.14-1.233-4.755-.91L3.5 2.87V2.75Z" />
        </svg>
        <span>Report</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2
                id="report-dialog-title"
                className="text-lg font-semibold text-slate-900"
              >
                Report {targetLabel}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {state?.success ? (
              <div className="my-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
                <p className="font-medium">{state.message}</p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form action={formAction} className="mt-4 flex flex-col gap-4">
                {state?.message && !state?.success && (
                  <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                    {state.message}
                  </div>
                )}

                {postId && <input type="hidden" name="postId" value={postId} />}
                {commentId && (
                  <input type="hidden" name="commentId" value={commentId} />
                )}
                {announcementId && (
                  <input
                    type="hidden"
                    name="announcementId"
                    value={announcementId}
                  />
                )}

                <div>
                  <label
                    htmlFor="report-reason"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Reason for reporting
                  </label>
                  <select
                    id="report-reason"
                    name="reason"
                    required
                    defaultValue=""
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="" disabled>
                      Select a reason...
                    </option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-remarks"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Additional details{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="report-remarks"
                    name="remarks"
                    rows={3}
                    maxLength={1000}
                    placeholder="Provide additional context for moderators..."
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isPending ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
