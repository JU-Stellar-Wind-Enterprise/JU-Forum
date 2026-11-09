"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Profile } from "@/components/profile/ProfileCard";
import type { ActionResult } from "@/types/result";

interface EditProfileFormProps {
  profile: Profile;
  action: (
    state: ActionResult | undefined,
    data: FormData,
  ) => Promise<ActionResult | undefined>;
}

/**
 * Interactive form component for editing user profile information.
 */
export function EditProfileForm({ profile, action }: EditProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [avatarUrl, setAvatarUrl] = useState(profile.profilePictureUrl || "");
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || "");
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;

    if (interests.length >= 10) {
      setTagError("Academic interest tags cannot exceed 10 tags.");
      return;
    }

    if (interests.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagError("Duplicate interest tags are not allowed.");
      return;
    }

    setInterests([...interests, trimmed]);
    setTagInput("");
    setTagError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setInterests(interests.filter((tag) => tag !== tagToRemove));
    setTagError(null);
  };

  return (
    <form
      action={formAction}
      className="w-full max-w-2xl rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your public profile details, bio, avatar, and academic
          interests.
        </p>
      </div>

      {state?.success && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {state.message || "Profile updated successfully."}
        </div>
      )}

      {state?.message && !state.success && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Nickname */}
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-semibold text-slate-700"
          >
            Display Nickname
          </label>
          <div className="mt-1">
            <input
              id="nickname"
              name="nickname"
              type="text"
              defaultValue={profile.nickname || ""}
              placeholder="e.g. johndoe"
              className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Letters, numbers, dashes, and underscores only. Nicknames can only
            be modified once every 7 days.
          </p>
        </div>

        {/* Avatar Image URL & Preview */}
        <div>
          <label
            htmlFor="profilePictureUrl"
            className="block text-sm font-semibold text-slate-700"
          >
            Avatar Image URL
          </label>
          <div className="mt-1 flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
              {avatarUrl ? (
                // biome-ignore lint/performance/noImgElement: arbitrary user-supplied image URL
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="size-full object-cover"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                profile.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <input
              id="profilePictureUrl"
              name="profilePictureUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Provide a direct image URL (http:// or https://) for your profile
            picture.
          </p>
        </div>

        {/* About Me */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="aboutMe"
              className="block text-sm font-semibold text-slate-700"
            >
              About Me (Biography)
            </label>
            <span
              className={`text-xs ${
                aboutMe.length > 500
                  ? "font-semibold text-red-600"
                  : "text-slate-400"
              }`}
            >
              {aboutMe.length}/500
            </span>
          </div>
          <div className="mt-1">
            <textarea
              id="aboutMe"
              name="aboutMe"
              rows={4}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Share a short bio, research interests, or academic background..."
              className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Academic Interest Tags */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="interestInput"
              className="block text-sm font-semibold text-slate-700"
            >
              Academic Interest Tags
            </label>
            <span className="text-xs text-slate-400">
              {interests.length}/10 tags
            </span>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              id="interestInput"
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="e.g. Distributed Systems, Machine Learning"
              className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="shrink-0 rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
            >
              Add Tag
            </button>
          </div>

          {tagError && <p className="mt-1 text-xs text-red-600">{tagError}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full p-0.5 text-sky-500 hover:bg-sky-200 hover:text-sky-800"
                  aria-label={`Remove ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          {/* Hidden input to submit interests through FormData */}
          <input type="hidden" name="interests" value={interests.join(",")} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/profile"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Back to Profile
        </Link>
        <button
          type="submit"
          disabled={pending || aboutMe.length > 500}
          className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
