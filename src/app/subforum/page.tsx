import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listSubforums } from "@/services/subforum.service";

export default async function SubforumPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const items = await listSubforums();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold">Subforums</h1>
        <Link href="/subforum/create" className="underline">
          Create subforum
        </Link>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/subforum/${item.id}`}
            className="block rounded-xl border p-5"
          >
            <h2 className="font-semibold">{item.name}</h2>
            <p className="text-zinc-600">{item.description}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Created by {item.owner.name}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
