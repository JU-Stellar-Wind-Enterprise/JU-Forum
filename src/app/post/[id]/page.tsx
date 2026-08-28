import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { VoteButtons } from "@/components/post/VoteButtons";
import { getCurrentUser } from "@/lib/session";
import { findPostById } from "@/services/post.service";
import { getVoteSummary } from "@/services/vote.service";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const post = await findPostById((await params).id);
  if (!post) notFound();
  const votes = await getVoteSummary(post.id, user.id);
  return (
    <PageShell>
      <article className="rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href={`/subforum/${post.subforum.id}`}
          className="text-sm font-medium text-blue-600 underline"
        >
          {post.subforum.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-500">By {post.author.name}</p>
        <p className="mt-8 whitespace-pre-wrap text-slate-700">
          {post.content}
        </p>
        <VoteButtons
          postId={post.id}
          {...votes}
          disabled={
            post.isLocked || post.isArchived || user.status !== "ACTIVE"
          }
        />
      </article>
    </PageShell>
  );
}
