"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types/result";

/** Renders the announcement creation form. */
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
      className="flex w-full max-w-xl flex-col gap-4 rounded-xl border p-6"
    >
      <input
        required
        name="title"
        placeholder="Announcement title"
        className="rounded border px-3 py-2"
      />
      <textarea
        required
        name="content"
        rows={8}
        placeholder="Announcement content"
        className="rounded border px-3 py-2"
      />
      <select
        name="priority"
        defaultValue="MEDIUM"
        className="rounded border px-3 py-2"
      >
        <option value="LOW">Low priority</option>
        <option value="MEDIUM">Medium priority</option>
        <option value="HIGH">High priority</option>
        <option value="URGENT">Urgent</option>
      </select>
      <select
        name="targetAudience"
        defaultValue="ALL"
        className="rounded border px-3 py-2"
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
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </label>
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish announcement"}
      </button>
    </form>
  );
}