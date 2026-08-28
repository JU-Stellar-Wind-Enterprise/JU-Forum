import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/session";
import {
  canCreateAnnouncement,
  listAnnouncements,
} from "@/services/announcement.service";

export default async function AnnouncementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await listAnnouncements(user.role);
  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
        {canCreateAnnouncement(user.role) && (
          <Link
            href="/announcement/create"
            className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Create announcement
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/announcement/${item.id}`}
            className="block rounded-lg border border-sky-100 bg-white p-5 shadow-sm hover:border-sky-300"
          >
            <p className="text-xs font-medium uppercase text-sky-700">
              {item.priority} · {item.targetAudience}
            </p>
            <h2 className="mt-2 font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-500">By {item.author.name}</p>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-sky-200 bg-white/70 p-8 text-center text-slate-500">
            No announcements are available.
          </p>
        )}
      </div>
    </PageShell>
  );
}
