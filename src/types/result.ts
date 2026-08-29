/**
 * Represents a serializable result returned by services and Server Actions.
 *
 * @typeParam T - The optional success payload type, such as a created record ID.
 */
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success?: false; message: string };
