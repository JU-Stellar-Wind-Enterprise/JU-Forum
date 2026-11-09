"use client";

import { useState, useTransition } from "react";
import {
  dismissReportAction,
  resolveReportAction,
} from "@/actions/report.actions";
import type { ReportReason, ReportStatus } from "@/generated/prisma/enums";
import type { ActionResult } from "@/types/result";

export interface ReportItem {
  id: string;
  reason: ReportReason;
  remarks: string | null;
  status: ReportStatus;
  reporterId: string;
  postId: string | null;
  commentId: string | null;
  announcementId: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  post?: {
    id: string;
    title: string;
  } | null;
  comment?: {
    id: string;
    content: string;
    isDeleted: boolean;
  } | null;
  announcement?: {
    id: string;
    title: string;
  } | null;
}

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  OFFENSIVE: "Offensive Content",
  FALSE_INFORMATION: "False Information",
  ACADEMIC_MISCONDUCT: "Academic Misconduct",
  OTHER: "Other",
};

export function ModerationReportList({
  initialReports,
}: {
  initialReports: ReportItem[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [actionType, setActionType] = useState<"RESOLVE" | "DISMISS" | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredReports = initialReports.filter((report) => {
    if (statusFilter === "ALL") return true;
    return report.status === statusFilter;
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !actionType) return;

    startTransition(async () => {
      let res: ActionResult<{ id: string }>;
      if (actionType === "RESOLVE") {
        res = await resolveReportAction(selectedReport.id, notes);
      } else {
        res = await dismissReportAction(selectedReport.id, notes);
      }

      if (res.success) {
        setActionMessage(res.message || "Action completed successfully.");
        setSelectedReport(null);
        setActionType(null);
        setNotes("");
      } else {
        setActionMessage(res.message || "Failed to complete action.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {actionMessage && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 flex justify-between items-center">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-sky-600 hover:text-sky-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {["ALL", "PENDING", "RESOLVED", "DISMISSED"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === status
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}{" "}
            <span className="text-xs text-slate-400">
              (
              {status === "ALL"
                ? initialReports.length
                : initialReports.filter((r) => r.status === status).length}
              )
            </span>
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No reports found in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      report.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : report.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {report.status}
                  </span>
                  <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-medium text-rose-700">
                    {REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Reported on {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Target info */}
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase text-slate-400">
                  Target Content:{" "}
                  {report.postId
                    ? "Post"
                    : report.commentId
                      ? "Comment"
                      : "Announcement"}
                </p>
                {report.post && (
                  <p className="mt-1 font-medium text-slate-800">
                    Post: {report.post.title}
                  </p>
                )}
                {report.comment && (
                  <p className="mt-1 text-slate-700 italic">
                    "{report.comment.content}"
                  </p>
                )}
                {report.announcement && (
                  <p className="mt-1 font-medium text-slate-800">
                    Announcement: {report.announcement.title}
                  </p>
                )}
              </div>

              {/* Remarks */}
              {report.remarks && (
                <div className="text-sm">
                  <span className="font-medium text-slate-700">
                    Reporter Remarks:{" "}
                  </span>
                  <span className="text-slate-600">{report.remarks}</span>
                </div>
              )}

              <div className="text-xs text-slate-500">
                Reported by:{" "}
                <span className="font-medium text-slate-700">
                  {report.reporter.name}
                </span>{" "}
                ({report.reporter.email})
              </div>

              {/* Review notes if reviewed */}
              {report.reviewedBy && (
                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-medium">Reviewed by:</span>{" "}
                    {report.reviewedBy.name}
                  </p>
                  {report.reviewNotes && (
                    <p className="mt-1">
                      <span className="font-medium">Notes:</span>{" "}
                      {report.reviewNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons for pending reports */}
              {report.status === "PENDING" && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setActionType("DISMISS");
                      setNotes("");
                    }}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setActionType("RESOLVE");
                      setNotes("");
                    }}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Take Action & Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedReport && actionType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-semibold text-slate-900">
              {actionType === "RESOLVE" ? "Resolve Report" : "Dismiss Report"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {actionType === "RESOLVE"
                ? "Mark this report as resolved. You can add notes on actions taken (e.g., hidden content, warning issued)."
                : "Dismiss this report as unfounded or invalid."}
            </p>

            <form
              onSubmit={handleActionSubmit}
              className="mt-4 flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="moderation-notes"
                  className="block text-sm font-medium text-slate-700"
                >
                  Review Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="moderation-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes explaining your decision..."
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setActionType(null);
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                    actionType === "RESOLVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {isPending
                    ? "Saving..."
                    : actionType === "RESOLVE"
                      ? "Resolve Report"
                      : "Dismiss Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
