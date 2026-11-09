"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleSubforumFollowAction } from "@/actions/subforum.actions";
import type { ActionResult } from "@/types/result";

type ToggleFollowFn = (
  subforumId: string,
) => Promise<ActionResult<{ following: boolean }>>;

/**
 * Renders an optimistic Follow / Following toggle button for a subforum page.
 *
 * @param props - The subforum ID, initial follow state, disabled flag, and optional action override.
 * @returns An interactive button with accessible pressed state and inline error feedback.
 */
export function FollowSubforumButton({
  subforumId,
  initialFollowing,
  disabled = false,
  toggleFollow = toggleSubforumFollowAction,
}: {
  subforumId: string;
  initialFollowing: boolean;
  disabled?: boolean;
  toggleFollow?: ToggleFollowFn;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic<
    boolean,
    boolean
  >(following, (_state, next) => next);

  function handleToggle() {
    if (disabled || isPending) return;
    setError(null);
    const nextState = !following;

    startTransition(async () => {
      setOptimisticFollowing(nextState);
      try {
        const result = await toggleFollow(subforumId);
        if (!result.success || !result.data) {
          setError(
            result.message ||
              "Unable to update follow status. Please try again.",
          );
          return;
        }
        setFollowing(result.data.following);
      } catch {
        setError("Unable to update follow status. Please try again.");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={disabled || isPending}
        aria-pressed={optimisticFollowing}
        onClick={handleToggle}
        className={`rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
          optimisticFollowing
            ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/60"
        }`}
      >
        {optimisticFollowing ? "Following" : "Follow subforum"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
