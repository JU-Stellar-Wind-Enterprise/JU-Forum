"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types/result";

/** Renders the form used to create a subforum. */
export function SubforumForm({
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
        name="name"
        maxLength={80}
        placeholder="Subforum name"
        className="rounded-md border border-slate-200 px-3 py-2.5"
      />
      <textarea
        required
        name="description"
        maxLength={500}
        placeholder="Description"
        rows={5}
        className="rounded-md border border-slate-200 px-3 py-2.5"
      />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create subforum"}
      </button>
    </form>
  );
}
