"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types/result";

type SubforumOption = { id: string; name: string };

/** Renders the authenticated post creation form. */
export function PostForm({
  action,
  subforums,
  defaultSubforumId = "",
}: {
  action: (
    state: ActionResult | undefined,
    data: FormData,
  ) => Promise<ActionResult | undefined>;
  subforums: SubforumOption[];
  defaultSubforumId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className="flex w-full max-w-xl flex-col gap-4 rounded-xl border p-6"
    >
      <select
        required
        name="subforumId"
        defaultValue={defaultSubforumId}
        className="rounded border px-3 py-2"
      >
        <option value="" disabled>
          Select subforum
        </option>
        {subforums.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <input
        required
        name="title"
        maxLength={150}
        placeholder="Post title"
        className="rounded border px-3 py-2"
      />
      <textarea
        required
        name="content"
        maxLength={10000}
        rows={10}
        placeholder="Write your post"
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
        {pending ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}