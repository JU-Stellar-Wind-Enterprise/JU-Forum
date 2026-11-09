import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminRepo from "@/repositories/admin-dashboard.repository";
import {
  canAccessAdminDashboard,
  getPendingModeratorApplications,
  getPlatformStats,
  getUsers,
  grantModeratorPrivileges,
  publishAlertNotice,
  revokeModeratorPrivileges,
  updateUserStatus,
} from "./admin-dashboard.service";

vi.mock("@/repositories/admin-dashboard.repository", () => ({
  countPlatformStats: vi.fn(),
  findUsers: vi.fn(),
  findUserById: vi.fn(),
  updateUserStatus: vi.fn(),
  findPendingModeratorApplications: vi.fn(),
  setUserRole: vi.fn(),
  createPlatformAlert: vi.fn(),
}));

describe("admin-dashboard.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canAccessAdminDashboard", () => {
    it("returns true for ADMIN and SYSTEM_ADMIN", () => {
      expect(canAccessAdminDashboard("ADMIN")).toBe(true);
      expect(canAccessAdminDashboard("SYSTEM_ADMIN")).toBe(true);
    });

    it("returns false for non-admin roles", () => {
      expect(canAccessAdminDashboard("STUDENT")).toBe(false);
      expect(canAccessAdminDashboard("FACULTY")).toBe(false);
      expect(canAccessAdminDashboard("STAFF")).toBe(false);
      expect(canAccessAdminDashboard("MODERATOR")).toBe(false);
    });
  });

  describe("getPlatformStats", () => {
    it("returns unauthorized error if user is not admin", async () => {
      const result = await getPlatformStats("STUDENT");
      expect(result).toEqual({
        message:
          "Unauthorized access warning: administrative privileges required.",
      });
    });

    it("returns platform statistics for administrator", async () => {
      vi.mocked(adminRepo.countPlatformStats).mockResolvedValue({
        totalUsers: 150,
        activeSubforums: 12,
        publishedDiscussions: 340,
        pendingReports: 5,
      });

      const result = await getPlatformStats("ADMIN");
      expect(result).toEqual({
        success: true,
        data: {
          totalUsers: 150,
          activeSubforums: 12,
          publishedDiscussions: 340,
          pendingReports: 5,
        },
      });
    });
  });

  describe("getUsers", () => {
    it("returns unauthorized error if user is not admin", async () => {
      const result = await getUsers({
        actorRole: "FACULTY",
      });
      expect(result).toEqual({
        message:
          "Unauthorized access warning: administrative privileges required.",
      });
    });

    it("returns list of users with filter options", async () => {
      const mockUsers = [
        {
          id: "u1",
          name: "John Doe",
          email: "john@juniv.edu",
          role: "STUDENT" as const,
          status: "ACTIVE" as const,
          appliedForModerator: false,
          createdAt: new Date(),
        },
      ];
      vi.mocked(adminRepo.findUsers).mockResolvedValue(mockUsers);

      const result = await getUsers({
        actorRole: "ADMIN",
        search: "john",
        role: "STUDENT",
      });

      expect(result).toEqual({
        success: true,
        data: mockUsers,
      });
    });
  });

  describe("updateUserStatus", () => {
    it("returns unauthorized error if actor is not admin", async () => {
      const result = await updateUserStatus({
        actorId: "user-1",
        actorRole: "STUDENT",
        targetUserId: "user-2",
        newStatus: "SUSPENDED",
      });
      expect(result).toEqual({
        message:
          "Unauthorized access warning: administrative privileges required.",
      });
    });

    it("blocks administrator from suspending their own account", async () => {
      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "admin-1",
        newStatus: "SUSPENDED",
      });
      expect(result).toEqual({
        message: "You cannot suspend your own account.",
      });
    });

    it("blocks ADMIN from modifying another top-level administrator permissions", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "target-admin",
        name: "Admin User",
        email: "admin2@juniv.edu",
        role: "ADMIN",
        status: "ACTIVE",
        appliedForModerator: false,
      });

      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "target-admin",
        newStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Cannot modify another top-level administrator's permissions.",
      });
    });

    it("blocks ADMIN from modifying SYSTEM_ADMIN", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "sys-admin",
        name: "Super Admin",
        email: "sysadmin@juniv.edu",
        role: "SYSTEM_ADMIN",
        status: "ACTIVE",
        appliedForModerator: false,
      });

      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "sys-admin",
        newStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Cannot modify another top-level administrator's permissions.",
      });
    });

    it("returns user not found error when target user does not exist", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue(null);

      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "unknown-user",
        newStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "User not found.",
      });
    });

    it("returns spec-mandated rollback error message if database sync fails", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "student-1",
        name: "Student One",
        email: "student1@juniv.edu",
        role: "STUDENT",
        status: "ACTIVE",
        appliedForModerator: false,
      });
      vi.mocked(adminRepo.updateUserStatus).mockRejectedValue(
        new Error("DB sync failed"),
      );

      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "student-1",
        newStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Unable to update user status. Please try again.",
      });
    });

    it("successfully updates user status", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "student-1",
        name: "Student One",
        email: "student1@juniv.edu",
        role: "STUDENT",
        status: "ACTIVE",
        appliedForModerator: false,
      });
      vi.mocked(adminRepo.updateUserStatus).mockResolvedValue({
        id: "student-1",
        name: "Student One",
        email: "student1@juniv.edu",
        role: "STUDENT",
        status: "SUSPENDED",
      });

      const result = await updateUserStatus({
        actorId: "admin-1",
        actorRole: "ADMIN",
        targetUserId: "student-1",
        newStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        success: true,
        message: "User status updated successfully.",
        data: {
          id: "student-1",
          status: "SUSPENDED",
        },
      });
    });
  });

  describe("moderator management", () => {
    it("lists pending moderator applications for admin", async () => {
      const apps = [
        {
          id: "student-2",
          name: "Applicant",
          email: "app@juniv.edu",
          role: "STUDENT" as const,
          appliedForModerator: true,
          createdAt: new Date(),
        },
      ];
      vi.mocked(adminRepo.findPendingModeratorApplications).mockResolvedValue(
        apps,
      );

      const result = await getPendingModeratorApplications("ADMIN");
      expect(result).toEqual({
        success: true,
        data: apps,
      });
    });

    it("grants moderator privileges and resets applied flag", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "student-2",
        name: "Applicant",
        email: "app@juniv.edu",
        role: "STUDENT",
        status: "ACTIVE",
        appliedForModerator: true,
      });
      vi.mocked(adminRepo.setUserRole).mockResolvedValue({
        id: "student-2",
        role: "MODERATOR",
        appliedForModerator: false,
      });

      const result = await grantModeratorPrivileges({
        actorRole: "ADMIN",
        targetUserId: "student-2",
      });

      expect(result).toEqual({
        success: true,
        message: "Moderator privileges granted successfully.",
      });
      expect(adminRepo.setUserRole).toHaveBeenCalledWith(
        "student-2",
        "MODERATOR",
        false,
      );
    });

    it("revokes moderator privileges", async () => {
      vi.mocked(adminRepo.findUserById).mockResolvedValue({
        id: "mod-1",
        name: "Moderator User",
        email: "mod@juniv.edu",
        role: "MODERATOR",
        status: "ACTIVE",
        appliedForModerator: false,
      });
      vi.mocked(adminRepo.setUserRole).mockResolvedValue({
        id: "mod-1",
        role: "STUDENT",
        appliedForModerator: false,
      });

      const result = await revokeModeratorPrivileges({
        actorRole: "ADMIN",
        targetUserId: "mod-1",
      });

      expect(result).toEqual({
        success: true,
        message: "Moderator privileges revoked successfully.",
      });
      expect(adminRepo.setUserRole).toHaveBeenCalledWith(
        "mod-1",
        "STUDENT",
        false,
      );
    });
  });

  describe("publishAlertNotice", () => {
    it("returns unauthorized error if actor is not admin", async () => {
      const result = await publishAlertNotice({
        actorId: "user-1",
        actorRole: "STUDENT",
        title: "Campus Alert",
        content: "Campus closes early today",
      });
      expect(result).toEqual({
        message:
          "Unauthorized access warning: administrative privileges required.",
      });
    });

    it("validates title and content are required", async () => {
      const result = await publishAlertNotice({
        actorId: "admin-1",
        actorRole: "ADMIN",
        title: "",
        content: "",
      });
      expect(result).toEqual({
        message: "Title and content are required for alert notice.",
      });
    });

    it("creates an urgent platform-wide announcement", async () => {
      vi.mocked(adminRepo.createPlatformAlert).mockResolvedValue({
        id: "alert-101",
        title: "Severe Weather Warning",
        content: "Classes suspended today due to cyclone alert.",
        priority: "URGENT",
        targetAudience: "ALL",
        authorId: "admin-1",
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await publishAlertNotice({
        actorId: "admin-1",
        actorRole: "ADMIN",
        title: "Severe Weather Warning",
        content: "Classes suspended today due to cyclone alert.",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "alert-101" },
        message: "Platform-wide alert notice published.",
      });
      expect(adminRepo.createPlatformAlert).toHaveBeenCalledWith({
        title: "Severe Weather Warning",
        content: "Classes suspended today due to cyclone alert.",
        priority: "URGENT",
        targetAudience: "ALL",
        authorId: "admin-1",
        expiresAt: null,
      });
    });
  });
});
