import { findPublicProfile } from "@/repositories/profile.repository";

/**
 * Retrieves the fields that are safe to display on a public profile page.
 *
 * @param id - The unique ID of the user whose profile is requested.
 * @returns The active user's public profile, or `null` when it is unavailable.
 * @throws If the database query fails.
 */
export const getPublicProfile = (id: string) => findPublicProfile(id);
