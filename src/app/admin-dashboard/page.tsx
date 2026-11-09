import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeratorApplicationsList } from "@/components/admin-dashboard/ModeratorApplicationsList";
import { PlatformAlertForm } from "@/components/admin-dashboard/PlatformAlertForm";
import { StatsOverview } from "@/components/admin-dashboard/StatsOverview";
import { UserManagementTable } from "@/components/admin-dashboard/UserManagementTable";
import { PageShell } from "@/components/layout/PageShell";
import { getCurrentUser } from "@/lib/session";
import {
  canAccessAdminDashboard,
  getPendingModeratorApplications,
  getPlatformStats,
  getUsers,
} from "@/services/admin-dashboard.service";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Spec Failure condition: If a non-admin user attempts to access administrative pages,
  // the system blocks access and returns an unauthorized access warning.
  if (!canAccessAdminDashboard(user.role)) {
    return (
      <PageShell centered>
        <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🚫</div>
          <h1 className="text-2xl font-bold text-red-900">
            Unauthorized Access Warning
          </h1>
          <p className="mt-2 text-sm text-red-700">
            You do not have administrative privileges to access this page.
            Administrative credentials are required.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Return to Home
          </Link>
        </div>
      </PageShell>
    );
  }

  const [statsResult, usersResult, appsResult] = await Promise.all([
    getPlatformStats(user.role),
    getUsers({ actorRole: user.role }),
    getPendingModeratorApplications(user.role),
  ]);

  const stats =
    statsResult.success && statsResult.data
      ? statsResult.data
      : {
          totalUsers: 0,
          activeSubforums: 0,
          publishedDiscussions: 0,
          pendingReports: 0,
        };

  const users = usersResult.success && usersResult.data ? usersResult.data : [];
  const applications =
    appsResult.success && appsResult.data ? appsResult.data : [];

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Jahangirnagar University Forum Platform Oversight & Moderation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {user.role}
          </span>
        </div>
      </div>

      {/* Real-time Platform Statistics */}
      <StatsOverview stats={stats} />

      {/* Platform-wide Alert Broadcast Notice */}
      <PlatformAlertForm />

      {/* Pending Moderator Applications */}
      <ModeratorApplicationsList applications={applications} />

      {/* User Management and Moderation */}
      <UserManagementTable
        initialUsers={users}
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    </PageShell>
  );
}
