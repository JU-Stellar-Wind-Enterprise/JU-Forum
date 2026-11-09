"use client";

import { useState } from "react";
import {
  grantModeratorPrivilegesAction,
  revokeModeratorPrivilegesAction,
} from "@/actions/admin-dashboard.actions";
import type { UserRole } from "@/generated/prisma/client";

interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  appliedForModerator: boolean;
  createdAt: Date;
}

export function ModeratorApplicationsList({
  applications,
}: {
  applications: ApplicationUser[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleGrant = async (userId: string) => {
    setLoadingId(userId);
    setFeedback(null);
    const formData = new FormData();
    formData.append("targetUserId", userId);
    try {
      const res = await grantModeratorPrivilegesAction(undefined, formData);
      if (res.success) {
        setFeedback({
          success: true,
          message: res.message || "Moderator privileges granted successfully.",
        });
      } else {
        setFeedback({
          success: false,
          message: res.message || "Failed to grant privileges.",
        });
      }
    } catch {
      setFeedback({
        success: false,
        message: "An unexpected error occurred.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (userId: string) => {
    setLoadingId(userId);
    setFeedback(null);
    const formData = new FormData();
    formData.append("targetUserId", userId);
    formData.append("newRole", "STUDENT");
    try {
      const res = await revokeModeratorPrivilegesAction(undefined, formData);
      if (res.success) {
        setFeedback({
          success: true,
          message: "Application declined.",
        });
      } else {
        setFeedback({
          success: false,
          message: res.message || "Failed to decline application.",
        });
      }
    } catch {
      setFeedback({
        success: false,
        message: "An unexpected error occurred.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (applications.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-indigo-950 flex items-center gap-2">
            <span>🛡️</span> Pending Moderator Applications
          </h2>
          <p className="text-sm text-indigo-700">
            Review community members who requested subforum moderator
            permissions.
          </p>
        </div>
        <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-bold text-indigo-800">
          {applications.length} Pending
        </span>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm font-medium ${
            feedback.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="divide-y divide-indigo-100 overflow-hidden rounded-lg border border-indigo-200 bg-white">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3"
          >
            <div>
              <p className="font-semibold text-gray-900">{app.name}</p>
              <p className="text-xs text-gray-500">
                {app.email} • Current role:{" "}
                <span className="font-medium text-gray-700">{app.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGrant(app.id)}
                disabled={loadingId === app.id}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-green-700 disabled:opacity-50"
              >
                {loadingId === app.id
                  ? "Processing..."
                  : "Approve as Moderator"}
              </button>
              <button
                type="button"
                onClick={() => handleDecline(app.id)}
                disabled={loadingId === app.id}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
