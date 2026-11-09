const UTC_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formats an ISO timestamp deterministically in UTC for server/client parity.
 *
 * @param isoTimestamp - An ISO-8601 date string.
 * @returns A human-readable date string such as `"Nov 9, 2026"`.
 */
export function formatFeedDate(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return UTC_DATE_FORMATTER.format(parsed);
}
