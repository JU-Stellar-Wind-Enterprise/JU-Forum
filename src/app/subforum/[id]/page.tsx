import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/session";
import { listPostsBySubforum } from "@/repositories/post.repository";
import { findSubforumById } from "@/repositories/subforum.repository";

export default async function SubforumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");
  const subforum = await findSubforumById((await params).id);
  if (!subforum) notFound();
  const posts = await listPostsBySubforum(subforum.id);
  return (
    <PageShell>
      <section className="rounded-lg border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{subforum.name}</h1>
        <p className="mt-3 text-slate-600">{subforum.description}</p>
        <Link
          href={`/post/create?subforumId=${subforum.id}`}
          className="mt-6 inline-block rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Create a post
        </Link>
        <div className="mt-8 space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block rounded-lg border border-sky-100 p-4 hover:border-sky-300 hover:bg-sky-50/60"
            >
              <h2 className="font-semibold">{post.title}</h2>
              <p className="text-sm text-slate-500">By {post.author.name}</p>
            </Link>
          ))}
          {posts.length === 0 && (
            <p className="rounded-lg border border-dashed border-sky-200 p-8 text-center text-slate-500">
              No posts have been published here yet.
            </p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
