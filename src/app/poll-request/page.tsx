import { redirect } from "next/navigation";
import { createPollRequestAction } from "@/actions/poll.actions";
import { PageShell } from "@/components/layout/PageShell";
import { PollRequestForm } from "@/components/poll/PollRequestForm";
import { getCurrentUser } from "@/lib/session";
import { listSubforums } from "@/services/subforum.service";

export default async function PollRequestPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const subforums = await listSubforums();

  return (
    <PageShell centered>
      <div className="w-full max-w-2xl mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Propose a Community Poll
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit a topic and voting choices for community feedback across
          Jahangirnagar University.
        </p>
      </div>

      <PollRequestForm
        action={createPollRequestAction}
        subforums={subforums.map((sf) => ({ id: sf.id, name: sf.name }))}
      />
    </PageShell>
  );
}
