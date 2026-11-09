"use client";

import { useMemo, useState } from "react";
import { updateUserStatusAction } from "@/actions/admin-dashboard.actions";
import type { AccountStatus, UserRole } from "@/generated/prisma/client";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  appliedForModerator: boolean;
  createdAt: Date;
}

export function UserManagementTable({
  initialUsers,
  currentUserId,
  currentUserRole,
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
  currentUserRole: UserRole;
}) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search.trim() === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleStatusChange = async (
    targetUserId: string,
    newStatus: AccountStatus,
  ) => {
    setLoadingUserId(targetUserId);
    setFeedback(null);

    const formData = new FormData();
    formData.append("targetUserId", targetUserId);
    formData.append("newStatus", newStatus);

    try {
      const res = await updateUserStatusAction(undefined, formData);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId ? { ...u, status: newStatus } : u,
          ),
        );
        setFeedback({
          success: true,
          message: res.message || "User status updated successfully.",
        });
      } else {
        setFeedback({
          success: false,
          message:
            res.message || "Unable to update user status. Please try again.",
        });
      }
    } catch {
      setFeedback({
        success: false,
        message: "Unable to update user status. Please try again.",
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "SUSPENDED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REJECTED":
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
      case "PENDING_APPROVAL":
      case "OTP_PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            User Accounts & Role Management
          </h2>
          <p className="text-sm text-gray-500">
            Search, filter by university role, and manage account statuses.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`mb-6 rounded-lg p-4 text-sm font-medium ${
            feedback.success
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="user-search"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1"
          >
            Search User
          </label>
          <input
            id="user-search"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="role-filter"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1"
          >
            Role Filter
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="STAFF">Staff</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status-filter"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1"
          >
            Status Filter
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="OTP_PENDING">OTP Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No user accounts found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const isProtectedAdmin =
                  (user.role === "ADMIN" || user.role === "SYSTEM_ADMIN") &&
                  currentUserRole !== "SYSTEM_ADMIN";

                return (
                  <tr key={user.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                          user.status,
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status !== "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(user.id, "ACTIVE")
                            }
                            disabled={
                              loadingUserId === user.id || isProtectedAdmin
                            }
                            className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-40"
                          >
                            Activate
                          </button>
                        )}
                        {user.status !== "SUSPENDED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(user.id, "SUSPENDED")
                            }
                            disabled={
                              loadingUserId === user.id ||
                              isSelf ||
                              isProtectedAdmin
                            }
                            title={
                              isSelf
                                ? "You cannot suspend your own account"
                                : isProtectedAdmin
                                  ? "Cannot modify top-level administrator"
                                  : "Suspend account"
                            }
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
                          >
                            Suspend
                          </button>
                        )}
                        {user.status !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(user.id, "REJECTED")
                            }
                            disabled={
                              loadingUserId === user.id ||
                              isSelf ||
                              isProtectedAdmin
                            }
                            className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
