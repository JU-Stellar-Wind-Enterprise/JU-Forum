import { redirect } from "next/navigation";
import { createAnnouncementAction } from "@/actions/announcement.actions";
import { AnnouncementForm } from "@/components/announcement/AnnouncementForm";
import { PageShell } from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/session";
import { canCreateAnnouncement } from "@/services/announcement.service";

export default async function CreateAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateAnnouncement(user.role)) redirect("/announcement");
  return (
    <PageShell centered>
      <div className="flex w-full max-w-3xl flex-col items-center gap-5">
        <h1 className="text-3xl font-bold text-slate-900">
          Create announcement
        </h1>
        <AnnouncementForm action={createAnnouncementAction} />
      </div>
    </PageShell>
  );
}
