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
      className="flex w-full max-w-xl flex-col gap-4 rounded-xl border p-6"
    >
      <input
        required
        name="name"
        maxLength={80}
        placeholder="Subforum name"
        className="rounded border px-3 py-2"
      />
      <textarea
        required
        name="description"
        maxLength={500}
        placeholder="Description"
        rows={5}
        className="rounded border px-3 py-2"
      />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create subforum"}
      </button>
    </form>
  );
}
