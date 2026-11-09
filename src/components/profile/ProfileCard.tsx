import Link from "next/link";
import type { AccountStatus, UserRole } from "@/generated/prisma/client";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  batch: string | null;
  nickname: string | null;
  profilePictureUrl: string | null;
  aboutMe: string | null;
  interests?: string[];
  status: AccountStatus;
  createdAt: Date;
};

/**
 * Displays the public fields of a university member profile.
 *
 * @param props - The safe profile projection and ownership flag.
 * @returns A responsive profile card that marks missing optional values with a dash.
 */
export function ProfileCard({
  profile,
  isOwner = false,
}: {
  profile: Profile;
  isOwner?: boolean;
}) {
  return (
    <section className="w-full overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-7 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-white/20 text-xl font-bold">
              {profile.profilePictureUrl ? (
                // biome-ignore lint/performance/noImgElement: arbitrary user-supplied image URL
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.name}
                  className="size-full object-cover"
                />
              ) : (
                profile.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{profile.name}</h1>
              <p className="mt-1 text-sm text-sky-50">
                {profile.nickname ? `@${profile.nickname}` : "Nickname not set"}
              </p>
            </div>
          </div>
          {isOwner && (
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Email" value={profile.email} />
          <Info label="Role" value={profile.role} />
          <Info label="Account status" value={profile.status} />
          <Info label="Nickname" value={profile.nickname} />
          <Info
            label="Batch"
            value={profile.role === "STUDENT" ? profile.batch : null}
          />
          <Info label="Joined" value={profile.createdAt.toLocaleDateString()} />
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            About me
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">
            {profile.aboutMe || "—"}
          </p>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Academic Interests
          </h2>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No academic interests added yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}
