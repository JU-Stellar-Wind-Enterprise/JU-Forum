import { redirect } from "next/navigation";
import { createPostAction } from "@/actions/post.actions";
import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/post/PostForm";
import { getCurrentUser } from "@/lib/session";
import { listSubforums } from "@/services/subforum.service";

export default async function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ subforumId?: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");
  const subforums = await listSubforums();
  return (
    <PageShell centered>
      <div className="flex w-full max-w-3xl flex-col items-center gap-5">
        <h1 className="text-3xl font-bold text-slate-900">Create post</h1>
        <PostForm
          action={createPostAction}
          subforums={subforums}
          defaultSubforumId={(await searchParams).subforumId}
        />
      </div>
    </PageShell>
  );
}
