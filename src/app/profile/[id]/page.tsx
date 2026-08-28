import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getCurrentUser } from "@/lib/session";
import { getPublicProfile } from "@/services/profile.service";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");
  const profile = await getPublicProfile((await params).id);
  if (!profile) notFound();
  return (
    <PageShell centered>
      <ProfileCard profile={profile} />
    </PageShell>
  );
}
