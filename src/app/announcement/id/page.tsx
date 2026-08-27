import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { findAnnouncementById } from "@/services/announcement.service";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");
  const item = await findAnnouncementById((await params).id);
  if (!item) notFound();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <p className="text-sm font-medium">
        {item.priority} · {item.targetAudience}
      </p>
      <h1 className="mt-3 text-3xl font-bold">{item.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">By {item.author.name}</p>
      <p className="mt-8 whitespace-pre-wrap">{item.content}</p>
    </main>
  );
}