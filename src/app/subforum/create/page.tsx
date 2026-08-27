import { redirect } from "next/navigation";
import { createSubforumAction } from "@/actions/subforum.actions";
import { SubforumForm } from "@/components/subforum/SubforumForm";
import { getCurrentUser } from "@/lib/session";

export default async function CreateSubforumPage() {
  if (!(await getCurrentUser())) redirect("/login");
  return (
    <main className="flex flex-col items-center gap-5 p-8">
      <h1 className="text-2xl font-bold">Create subforum</h1>
      <SubforumForm action={createSubforumAction} />
    </main>
  );
}
