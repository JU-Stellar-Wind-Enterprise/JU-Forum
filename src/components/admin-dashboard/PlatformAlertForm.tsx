"use client";

import { useActionState, useState } from "react";
import { publishAlertNoticeAction } from "@/actions/admin-dashboard.actions";

export function PlatformAlertForm() {
  const [state, formAction, isPending] = useActionState(
    publishAlertNoticeAction,
    undefined,
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <span>📢</span> Platform-Wide Alert Broadcast
          </h2>
          <p className="text-sm text-red-700">
            Publish critical, university-wide emergency notices visible on all
            user feeds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          {isOpen ? "Close Notice Form" : "Create Broadcast Notice"}
        </button>
      </div>

      {isOpen && (
        <form action={formAction} className="mt-6 space-y-4">
          {state?.message && (
            <div
              className={`rounded-lg p-3 text-sm font-medium ${
                state.success
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {state.message}
            </div>
          )}

          <div>
            <label
              htmlFor="alert-title"
              className="block text-sm font-medium text-gray-700"
            >
              Alert Title
            </label>
            <input
              id="alert-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Severe Weather Closure or Campus Safety Notice"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="alert-content"
              className="block text-sm font-medium text-gray-700"
            >
              Alert Details & Instructions
            </label>
            <textarea
              id="alert-content"
              name="content"
              rows={3}
              required
              placeholder="Provide full details, precautions, and actionable instructions..."
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="alert-expiry"
              className="block text-sm font-medium text-gray-700"
            >
              Optional Expiration Date
            </label>
            <input
              id="alert-expiry"
              name="expiresAt"
              type="datetime-local"
              className="mt-1 rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Broadcasting..." : "Broadcast Alert"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
