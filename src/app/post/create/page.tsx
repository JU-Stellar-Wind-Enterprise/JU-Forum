import { redirect } from "next/navigation";
import { createPostAction } from "@/actions/post.actions";
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
    <main className="flex flex-col items-center gap-5 p-8">
      <h1 className="text-2xl font-bold">Create post</h1>
      <PostForm
        action={createPostAction}
        subforums={subforums}
        defaultSubforumId={(await searchParams).subforumId}
      />
    </main>
  );
}