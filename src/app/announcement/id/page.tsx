import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
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
    <PageShell>
      <article className="rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-sky-700">
          {item.priority} · {item.targetAudience}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{item.title}</h1>
        <p className="mt-2 text-sm text-slate-500">By {item.author.name}</p>
        <p className="mt-8 whitespace-pre-wrap text-slate-700">
          {item.content}
        </p>
      </article>
    </PageShell>
  );
}