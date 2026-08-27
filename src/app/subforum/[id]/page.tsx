import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">{subforum.name}</h1>
      <p className="mt-3 text-zinc-600">{subforum.description}</p>
      <Link
        href={`/post/create?subforumId=${subforum.id}`}
        className="mt-6 inline-block underline"
      >
        Create a post
      </Link>
      <div className="mt-8 space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="block rounded-lg border p-4"
          >
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-sm text-zinc-500">By {post.author.name}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
