import type { AccountStatus, UserRole } from "@/generated/prisma/client";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  batch: string | null;
  nickname: string | null;
  profilePictureUrl: string | null;
  aboutMe: string | null;
  status: AccountStatus;
  createdAt: Date;
};

/**
 * Displays the public fields of a university member profile.
 *
 * @param props - The safe profile projection returned by the profile service.
 * @returns A responsive profile card that marks missing optional values with a dash.
 */
export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <section className="w-full overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-7 text-white">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/20 text-xl font-bold">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{profile.name}</h1>
            <p className="mt-1 text-sm text-sky-50">
              {profile.nickname ? `@${profile.nickname}` : "Nickname not set"}
            </p>
          </div>
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
          <Info label="Profile picture" value={profile.profilePictureUrl} />
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            About me
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">
            {profile.aboutMe || "—"}
          </p>
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
