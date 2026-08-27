import { redirect } from "next/navigation";
import { createAnnouncementAction } from "@/actions/announcement.actions";
import { AnnouncementForm } from "@/components/announcement/AnnouncementForm";
import { getCurrentUser } from "@/lib/session";
import { canCreateAnnouncement } from "@/services/announcement.service";

export default async function CreateAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateAnnouncement(user.role)) redirect("/announcement");
  return (
    <main className="flex flex-col items-center gap-5 p-8">
      <h1 className="text-2xl font-bold">Create announcement</h1>
      <AnnouncementForm action={createAnnouncementAction} />
    </main>
  );
}