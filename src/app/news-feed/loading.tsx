import { PageShell } from "@/components/layout/PageShell";

export default function NewsFeedLoading() {
  return (
    <PageShell>
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg border border-sky-100 bg-white/80" />
        <div className="h-16 animate-pulse rounded-lg border border-sky-100 bg-white/80" />
        <div className="h-40 animate-pulse rounded-lg border border-sky-100 bg-white/80" />
        <div className="h-40 animate-pulse rounded-lg border border-sky-100 bg-white/80" />
      </div>
    </PageShell>
  );
}
