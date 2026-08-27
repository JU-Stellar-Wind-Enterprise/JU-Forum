import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">JU Forum</p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900">
              Welcome, {user.name}
            </h1>
            <p className="mt-2 text-zinc-600">
              You are successfully logged in.
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Info label="Email" value={user.email} />
          <Info label="Role" value={user.role} />
          <Info label="Account status" value={user.status} />
        </div>

        <nav
          className="mt-8 grid gap-3 sm:grid-cols-2"
          aria-label="Sprint 1 features"
        >
          <FeatureLink
            href="/subforum"
            title="Subforums"
            description="Browse or create discussion spaces."
          />
          <FeatureLink
            href="/post/create"
            title="Create post"
            description="Publish a post in a subforum."
          />
          <FeatureLink
            href="/announcement"
            title="Announcements"
            description="Read campus announcements."
          />
          <FeatureLink
            href="/profile"
            title="My profile"
            description="View your public member profile."
          />
        </nav>
      </section>
    </main>
  );
}

function FeatureLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="rounded-lg border p-4 hover:bg-zinc-50">
      <span className="font-semibold text-zinc-900">{title}</span>
      <span className="mt-1 block text-sm text-zinc-600">{description}</span>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 break-words font-medium text-zinc-900">{value}</p>
    </div>
  );
}
