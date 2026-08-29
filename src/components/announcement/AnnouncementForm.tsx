"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types/result";

/**
 * Renders the announcement creation form.
 *
 * @param props - The announcement Server Action invoked on submission.
 * @returns A client form for content, priority, audience, and optional expiry.
 */
export function AnnouncementForm({
  action,
}: {
  action: (
    state: ActionResult | undefined,
    data: FormData,
  ) => Promise<ActionResult | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className="flex w-full max-w-3xl flex-col gap-4 rounded-lg border border-sky-100 bg-white p-6 shadow-sm"
    >
      <input
        required
        name="title"
        placeholder="Announcement title"
        className="rounded-md border border-slate-200 px-3 py-2.5"
      />
      <textarea
        required
        name="content"
        rows={8}
        placeholder="Announcement content"
        className="rounded-md border border-slate-200 px-3 py-2.5"
      />
      <select
        name="priority"
        defaultValue="MEDIUM"
        className="rounded-md border border-slate-200 px-3 py-2.5"
      >
        <option value="LOW">Low priority</option>
        <option value="MEDIUM">Medium priority</option>
        <option value="HIGH">High priority</option>
        <option value="URGENT">Urgent</option>
      </select>
      <select
        name="targetAudience"
        defaultValue="ALL"
        className="rounded-md border border-slate-200 px-3 py-2.5"
      >
        <option value="ALL">All users</option>
        <option value="STUDENTS">Students</option>
        <option value="FACULTY">Faculty</option>
        <option value="STAFF">Staff</option>
      </select>
      <label className="text-sm">
        Expiration (optional)
        <input
          type="datetime-local"
          name="expiresAt"
          className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2.5"
        />
      </label>
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish announcement"}
      </button>
    </form>
  );
}