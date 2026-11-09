"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { updateProfile } from "@/services/profile.service";
import type { ActionResult } from "@/types/result";

/**
 * Updates the profile of the currently authenticated user.
 *
 * @param _ - Unused previous action state.
 * @param formData - Form data containing profile updates.
 * @returns An ActionResult indicating outcome or validation error.
 */
export async function updateProfileAction(
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | undefined> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    return { message: "You must be logged in to update your profile." };
  }

  const rawNickname = formData.get("nickname");
  const rawAvatar = formData.get("profilePictureUrl");
  const rawAboutMe = formData.get("aboutMe");
  const rawInterests = formData.get("interests");

  const nickname = rawNickname !== null ? String(rawNickname) : undefined;
  const profilePictureUrl = rawAvatar !== null ? String(rawAvatar) : undefined;
  const aboutMe = rawAboutMe !== null ? String(rawAboutMe) : undefined;

  let interests: string[] | undefined;
  if (rawInterests !== null) {
    const rawStr = String(rawInterests).trim();
    interests = rawStr
      ? rawStr
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }

  const result = await updateProfile({
    userId: user.id,
    nickname,
    profilePictureUrl,
    aboutMe,
    interests,
  });

  if (result.success) {
    revalidatePath("/profile");
    revalidatePath(`/profile/${user.id}`);
  }

  return result;
}
