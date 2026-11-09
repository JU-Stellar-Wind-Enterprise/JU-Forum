import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PendingPollsList } from "@/components/poll/PendingPollsList";
import { getCurrentUser } from "@/lib/session";
import { listPendingPollRequests } from "@/services/poll.service";

export default async function PendingPollsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isModeratorRole =
    user.role === "ADMIN" ||
    user.role === "SYSTEM_ADMIN" ||
    user.role === "MODERATOR";

  if (!isModeratorRole) {
    redirect("/polls");
  }

  const pendingRequests = await listPendingPollRequests();

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/polls"
            className="text-xs font-medium text-sky-600 hover:text-sky-800"
          >
            ← Back to approved polls
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Pending Poll Requests
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review and moderate community poll proposals before they open to
            voters.
          </p>
        </div>
      </div>

      <PendingPollsList
        polls={pendingRequests.map((p) => ({
          id: p.id,
          question: p.question,
          description: p.description,
          createdAt: p.createdAt,
          author: p.author,
          options: p.options,
          subforum: p.subforum,
        }))}
      />
    </PageShell>
  );
}
