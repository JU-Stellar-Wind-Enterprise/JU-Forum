import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getCurrentUser } from "@/lib/session";
import { getPublicProfile } from "@/services/profile.service";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getPublicProfile(user.id);
  if (!profile) redirect("/login");
  return (
    <main className="flex justify-center p-8">
      <ProfileCard profile={profile} />
    </main>
  );
}