import { redirect } from "next/navigation";
import { createSubforumAction } from "@/actions/subforum.actions";
import { PageShell } from "@/components/layout/PageShell";
import { SubforumForm } from "@/components/subforum/SubforumForm";
import { getCurrentUser } from "@/lib/session";

export default async function CreateSubforumPage() {
  if (!(await getCurrentUser())) redirect("/login");
  return (
    <PageShell centered>
      <div className="flex w-full max-w-3xl flex-col items-center gap-5">
        <h1 className="text-3xl font-bold text-slate-900">Create subforum</h1>
        <SubforumForm action={createSubforumAction} />
      </div>
    </PageShell>
  );
}
