import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import {
  ModerationReportList,
  type ReportItem,
} from "@/components/report/ModerationReportList";
import { getCurrentUser } from "@/lib/session";
import {
  canModerateReports,
  listModerationReports,
} from "@/services/report.service";

export default async function ModerationReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canModerateReports(user.role)) {
    redirect("/");
  }

  const reportsResult = await listModerationReports(user.role);
  const reports = (reportsResult.success && reportsResult.data
    ? reportsResult.data
    : []) as unknown as ReportItem[];

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                Dashboard
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-sm font-medium text-slate-600">
                Moderation
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Content Moderation Queue
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review flagged posts, comments, and announcements submitted by
              forum members.
            </p>
          </div>
        </div>

        <ModerationReportList initialReports={reports} />
      </div>
    </PageShell>
  );
}
