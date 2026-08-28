import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/session";
import { listSubforums } from "@/services/subforum.service";

export default async function SubforumPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const items = await listSubforums();
  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Subforums</h1>
        <Link
          href="/subforum/create"
          className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Create subforum
        </Link>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/subforum/${item.id}`}
            className="block rounded-lg border border-sky-100 bg-white p-5 shadow-sm hover:border-sky-300"
          >
            <h2 className="font-semibold">{item.name}</h2>
            <p className="mt-1 text-slate-600">{item.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              Created by {item.owner.name}
            </p>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-sky-200 bg-white/70 p-8 text-center text-slate-500">
            No subforums have been created yet.
          </p>
        )}
      </div>
    </PageShell>
  );
}
