import * as profileRepo from "@/repositories/profile.repository";
import type { ActionResult } from "@/types/result";

const OFFENSIVE_WORDS = [
  "admin",
  "administrator",
  "moderator",
  "mod",
  "system",
  "root",
  "support",
  "offensive_badword",
];

const NICKNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Sanitizes text to prevent script injection.
 */
function sanitizeBio(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Validates a profile avatar URL.
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Retrieves the fields that are safe to display on a public profile page.
 *
 * @param id - The unique ID of the user whose profile is requested.
 * @returns The active user's public profile, or `null` when it is unavailable.
 * @throws If the database query fails.
 */
export const getPublicProfile = (id: string) =>
  profileRepo.findPublicProfile(id);

export interface UpdateProfileInput {
  userId: string;
  nickname?: string | null;
  profilePictureUrl?: string | null;
  aboutMe?: string | null;
  interests?: string[];
}

/**
 * Validates and updates a user's editable profile information.
 *
 * @param input - The profile update fields along with the user's ID.
 * @returns An ActionResult indicating success or specific validation failure.
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  try {
    const user = await profileRepo.findUserById(input.userId);
    if (!user) {
      return { message: "Unable to update profile. Please try again later." };
    }

    let finalNickname: string | null | undefined;
    let nicknameLastChanged: Date | undefined;

    if (input.nickname !== undefined) {
      const trimmedNick = input.nickname ? input.nickname.trim() : null;

      if (trimmedNick) {
        if (!NICKNAME_REGEX.test(trimmedNick)) {
          return { message: "Invalid nickname provided." };
        }

        const lowerNick = trimmedNick.toLowerCase();
        if (OFFENSIVE_WORDS.some((word) => lowerNick.includes(word))) {
          return { message: "Invalid nickname provided." };
        }

        const isUnchanged =
          user.nickname && user.nickname.toLowerCase() === lowerNick;

        if (!isUnchanged) {
          if (user.nicknameLastChanged) {
            const elapsedMs =
              Date.now() - new Date(user.nicknameLastChanged).getTime();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (elapsedMs < sevenDaysMs) {
              return {
                message: "Nickname can only be changed once every 7 days.",
              };
            }
          }

          const existingUserWithNick =
            await profileRepo.findUserByNickname(trimmedNick);
          if (
            existingUserWithNick &&
            existingUserWithNick.id !== input.userId
          ) {
            return { message: "Nickname is already taken." };
          }

          nicknameLastChanged = new Date();
        }

        finalNickname = trimmedNick;
      } else {
        finalNickname = null;
      }
    }

    let finalAvatar: string | null | undefined;
    if (input.profilePictureUrl !== undefined) {
      const trimmedAvatar = input.profilePictureUrl
        ? input.profilePictureUrl.trim()
        : null;
      if (trimmedAvatar) {
        if (!isValidUrl(trimmedAvatar)) {
          return { message: "Invalid avatar image URL." };
        }
        finalAvatar = trimmedAvatar;
      } else {
        finalAvatar = null;
      }
    }

    let sanitizedAboutMe: string | null | undefined;
    if (input.aboutMe !== undefined) {
      if (input.aboutMe && input.aboutMe.length > 500) {
        return {
          message: "About Me text exceeds the allowed 500-character limit.",
        };
      }
      sanitizedAboutMe = input.aboutMe ? sanitizeBio(input.aboutMe) : "";
    }

    let finalInterests: string[] | undefined;
    if (input.interests !== undefined) {
      if (input.interests.length > 10) {
        return {
          message: "Academic interest tags cannot exceed 10 tags.",
        };
      }

      const seen = new Set<string>();
      for (const tag of input.interests) {
        const normalized = tag.trim().toLowerCase();
        if (seen.has(normalized)) {
          return { message: "Duplicate interest tags are not allowed." };
        }
        seen.add(normalized);
      }
      finalInterests = input.interests.map((t) => t.trim());
    }

    await profileRepo.updateUserProfile(input.userId, {
      nickname: finalNickname,
      profilePictureUrl: finalAvatar,
      aboutMe: sanitizedAboutMe,
      interests: finalInterests,
      nicknameLastChanged,
    });

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch {
    return { message: "Unable to update profile. Please try again later." };
  }
}
