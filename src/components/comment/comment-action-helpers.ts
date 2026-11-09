import type { ActionResult } from "@/types/result";

/**
 * Server Action signature accepted by comment form, vote, and delete controls.
 */
export type CommentFormAction<T = undefined> = (
  state: ActionResult<T> | undefined,
  data: FormData,
) => Promise<ActionResult<T> | undefined>;

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Invokes a comment Server Action and maps unexpected network failures to a fallback error message.
 *
 * @param action - The Server Action to execute.
 * @param prev - Previous React action state.
 * @param formData - Submitted form data payload.
 * @param fallbackMessage - Error message displayed when a network or unexpected error occurs.
 * @returns The Server Action result or a fallback failure result.
 * @throws Re-throws Next.js redirect control-flow signals so navigation proceeds normally.
 */
export async function invokeCommentAction<T = undefined>(
  action: CommentFormAction<T>,
  prev: ActionResult<T> | undefined,
  formData: FormData,
  fallbackMessage: string,
): Promise<ActionResult<T> | undefined> {
  try {
    return await action(prev, formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { message: fallbackMessage };
  }
}
