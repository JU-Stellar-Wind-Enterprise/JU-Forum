import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PollCard } from "@/components/poll/PollCard";
import { getCurrentUser } from "@/lib/session";
import { getPollWithResults } from "@/services/poll.service";

export default async function SinglePollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const poll = await getPollWithResults(id, user?.id);

  if (
    !poll ||
    (!poll.isApproved && user?.role !== "ADMIN" && user?.role !== "MODERATOR")
  ) {
    notFound();
  }

  return (
    <PageShell>
      <div className="mb-4">
        <Link
          href="/polls"
          className="text-xs font-medium text-sky-600 hover:text-sky-800"
        >
          ← Back to all polls
        </Link>
      </div>

      <PollCard
        poll={poll}
        currentUserId={user?.id}
        currentUserRole={user?.role}
      />
    </PageShell>
  );
}
