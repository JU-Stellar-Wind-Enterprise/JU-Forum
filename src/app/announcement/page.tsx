import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {canCreateAnnouncement(user.role) && (
          <Link href="/announcement/create" className="underline">
            Create announcement
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/announcement/${item.id}`}
            className="block rounded-xl border p-5"
          >
            <p className="text-xs font-medium uppercase">
              {item.priority} · {item.targetAudience}
            </p>
            <h2 className="mt-2 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">By {item.author.name}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}