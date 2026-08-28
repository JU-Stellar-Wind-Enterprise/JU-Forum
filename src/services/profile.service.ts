import { findPublicProfile } from "@/repositories/profile.repository";

/** Retrieves a safe public profile projection for an authenticated viewer. */
export const getPublicProfile = (id: string) => findPublicProfile(id);
