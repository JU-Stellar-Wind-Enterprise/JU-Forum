"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types/result";

type SubforumOption = { id: string; name: string };

/**
 * Renders the authenticated post creation form.
 *
 * @param props - The post action, selectable subforums, and optional default selection.
 * @returns A client form for selecting a subforum and composing a post.
 */
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
      className="flex w-full max-w-3xl flex-col gap-4 rounded-lg border border-sky-100 bg-white p-6 shadow-sm"
    >
      <select
        required
        name="subforumId"
        defaultValue={defaultSubforumId}
        className="rounded-md border border-slate-200 px-3 py-2.5"
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
        className="rounded-md border border-slate-200 px-3 py-2.5"
      />
      <textarea
        required
        name="content"
        maxLength={10000}
        rows={10}
        placeholder="Write your post"
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
        {pending ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}
