/** A serializable result returned by services and Server Actions. */
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success?: false; message: string };
