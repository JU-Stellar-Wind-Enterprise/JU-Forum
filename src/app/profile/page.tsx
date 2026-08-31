import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getCurrentUser } from "@/lib/session";
import { getPublicProfile } from "@/services/profile.service";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getPublicProfile(user.id);
  if (!profile) redirect("/login");
  return (
    <PageShell centered>
      <ProfileCard profile={profile} />
    </PageShell>
  );
}
