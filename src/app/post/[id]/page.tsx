import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommentSection } from "@/components/comment/CommentSection";
import { PageShell } from "@/components/layout/PageShell";
import { VoteButtons } from "@/components/post/VoteButtons";
import { getCurrentUser } from "@/lib/session";
import {
  canModerateComments,
  countVisibleComments,
  listPostComments,
} from "@/services/comment.service";
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

  const [votes, comments, canModerate] = await Promise.all([
    getVoteSummary(post.id, user.id),
    listPostComments(post.id, user.id),
    canModerateComments(user.id, user.role, post.subforumId),
  ]);
  const isClosed = post.isLocked || post.isArchived;
  const totalComments = countVisibleComments(comments);

  return (
    <PageShell>
      <article className="rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/subforum/${post.subforum.id}`}
            className="text-sm font-medium text-blue-600 underline"
          >
            {post.subforum.name}
          </Link>
          {isClosed && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {post.isArchived ? "Archived" : "Locked"}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-500">By {post.author.name}</p>
        <p className="mt-8 whitespace-pre-wrap text-slate-700">
          {post.content}
        </p>
        <VoteButtons
          postId={post.id}
          {...votes}
          disabled={isClosed || user.status !== "ACTIVE"}
        />
      </article>

      <CommentSection
        postId={post.id}
        comments={comments}
        totalCount={totalComments}
        isClosed={isClosed}
        currentUserId={user.id}
        currentUserStatus={user.status}
        canModerate={canModerate}
      />
    </PageShell>
  );
}
