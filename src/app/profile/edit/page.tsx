import { redirect } from "next/navigation";
import { updateProfileAction } from "@/actions/profile.actions";
import { PageShell } from "@/components/layout/PageShell";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { getCurrentUser } from "@/lib/session";
import { getPublicProfile } from "@/services/profile.service";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getPublicProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <PageShell centered>
      <EditProfileForm profile={profile} action={updateProfileAction} />
    </PageShell>
  );
}
