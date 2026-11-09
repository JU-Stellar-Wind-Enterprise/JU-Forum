"use client";

import { PageShell } from "@/components/layout/PageShell";

export default function NewsFeedError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PageShell>
      <section
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm"
      >
        <h1 className="text-xl font-semibold text-red-900">
          Unable to load feed items. Please refresh.
        </h1>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Refresh
        </button>
      </section>
    </PageShell>
  );
}
