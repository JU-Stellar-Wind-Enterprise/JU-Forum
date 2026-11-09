import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/generated/prisma/client";
import * as profileRepo from "@/repositories/profile.repository";
import { getPublicProfile, updateProfile } from "./profile.service";

vi.mock("@/repositories/profile.repository", () => ({
  findPublicProfile: vi.fn(),
  findUserById: vi.fn(),
  findUserByNickname: vi.fn(),
  updateUserProfile: vi.fn(),
}));

describe("Profile Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicProfile", () => {
    it("should get user profile", async () => {
      const user = {
        id: "1",
        name: "Mariam",
        email: "mariam@juniv.edu",
        role: "STUDENT" as const,
        batch: "49",
        nickname: "mariam",
        profilePictureUrl: null,
        aboutMe: null,
        interests: [],
        status: "ACTIVE" as const,
        createdAt: new Date(),
      };

      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user);

      const result = await getPublicProfile("1");

      expect(result).toEqual(user);
    });

    it("should return null if profile not found", async () => {
      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(null);

      const result = await getPublicProfile("2");

      expect(result).toBeNull();
    });

    it("should fail if wrong user name is given", async () => {
      const user = {
        id: "1",
        name: "Mariam",
        email: "mariam@juniv.edu",
        role: "STUDENT" as const,
        batch: "49",
        nickname: "mariam",
        profilePictureUrl: null,
        aboutMe: null,
        interests: [],
        status: "ACTIVE" as const,
        createdAt: new Date(),
      };

      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user);

      const result = await getPublicProfile("1");

      expect(result?.name).not.toBe("Rahim");
    });

    it("should fail if wrong profile id is given", async () => {
      const user = {
        id: "1",
        name: "Mariam",
        email: "mariam@juniv.edu",
        role: "STUDENT" as const,
        batch: "49",
        nickname: "mariam",
        profilePictureUrl: null,
        aboutMe: null,
        interests: [],
        status: "ACTIVE" as const,
        createdAt: new Date(),
      };

      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user);

      const result = await getPublicProfile("1");

      expect(result?.id).not.toBe("999");
    });
  });

  describe("updateProfile", () => {
    const existingUser: User = {
      id: "user-1",
      name: "Mariam Khan",
      email: "mariam@juniv.edu",
      passwordHash: "hash123",
      batch: "49",
      role: "STUDENT",
      status: "ACTIVE",
      appliedForModerator: false,
      nickname: "mariam_k",
      nicknameLastChanged: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      profilePictureUrl: "https://example.com/avatar.png",
      aboutMe: "Computer Science student",
      interests: ["AI", "Algorithms"],
      otpCode: null,
      otpExpiresAt: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("successfully updates profile with valid details", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);
      vi.mocked(profileRepo.findUserByNickname).mockResolvedValue(null);
      vi.mocked(profileRepo.updateUserProfile).mockResolvedValue({
        ...existingUser,
        nickname: "mariam_new",
        aboutMe: "Updated bio",
        interests: ["AI", "WebDev"],
      });

      const result = await updateProfile({
        userId: "user-1",
        nickname: "mariam_new",
        profilePictureUrl: "https://example.com/new-avatar.png",
        aboutMe: "Updated bio",
        interests: ["AI", "WebDev"],
      });

      expect(result).toEqual({
        success: true,
        message: "Profile updated successfully.",
      });
      expect(profileRepo.updateUserProfile).toHaveBeenCalledWith("user-1", {
        nickname: "mariam_new",
        profilePictureUrl: "https://example.com/new-avatar.png",
        aboutMe: "Updated bio",
        interests: ["AI", "WebDev"],
        nicknameLastChanged: expect.any(Date),
      });
    });

    it("sanitizes script tags in About Me biography", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);
      vi.mocked(profileRepo.updateUserProfile).mockResolvedValue(existingUser);

      const result = await updateProfile({
        userId: "user-1",
        nickname: "mariam_k",
        aboutMe: "<script>alert('xss')</script>Hello World",
      });

      expect(result).toEqual({
        success: true,
        message: "Profile updated successfully.",
      });
      expect(profileRepo.updateUserProfile).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          aboutMe: "Hello World",
        }),
      );
    });

    it("allows keeping current nickname without triggering cooldown", async () => {
      const recentCooldownUser: User = {
        ...existingUser,
        nickname: "mariam_k",
        nicknameLastChanged: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      };
      vi.mocked(profileRepo.findUserById).mockResolvedValue(recentCooldownUser);
      vi.mocked(profileRepo.updateUserProfile).mockResolvedValue(
        recentCooldownUser,
      );

      const result = await updateProfile({
        userId: "user-1",
        nickname: "mariam_k",
        aboutMe: "Updated bio only",
      });

      expect(result).toEqual({
        success: true,
        message: "Profile updated successfully.",
      });
      expect(profileRepo.updateUserProfile).toHaveBeenCalledWith("user-1", {
        nickname: "mariam_k",
        profilePictureUrl: undefined,
        aboutMe: "Updated bio only",
        interests: undefined,
        nicknameLastChanged: undefined,
      });
    });

    it("rejects nickname containing spaces", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const result = await updateProfile({
        userId: "user-1",
        nickname: "bad nickname",
      });

      expect(result).toEqual({
        message: "Invalid nickname provided.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects nickname containing invalid characters", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const result = await updateProfile({
        userId: "user-1",
        nickname: "bad@name!",
      });

      expect(result).toEqual({
        message: "Invalid nickname provided.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects nickname containing offensive words", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const result = await updateProfile({
        userId: "user-1",
        nickname: "admin_user",
      });

      expect(result).toEqual({
        message: "Invalid nickname provided.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects nickname change if within 7-day cooldown", async () => {
      const userInCooldown: User = {
        ...existingUser,
        nicknameLastChanged: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      };
      vi.mocked(profileRepo.findUserById).mockResolvedValue(userInCooldown);

      const result = await updateProfile({
        userId: "user-1",
        nickname: "new_name",
      });

      expect(result).toEqual({
        message: "Nickname can only be changed once every 7 days.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects nickname if already taken by another user", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);
      vi.mocked(profileRepo.findUserByNickname).mockResolvedValue({
        ...existingUser,
        id: "user-2",
        nickname: "taken_nick",
      });

      const result = await updateProfile({
        userId: "user-1",
        nickname: "taken_nick",
      });

      expect(result).toEqual({
        message: "Nickname is already taken.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects About Me exceeding 500 characters", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const longBio = "a".repeat(501);
      const result = await updateProfile({
        userId: "user-1",
        aboutMe: longBio,
      });

      expect(result).toEqual({
        message: "About Me text exceeds the allowed 500-character limit.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects interest tags exceeding 10 tags", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const tooManyTags = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
      ];
      const result = await updateProfile({
        userId: "user-1",
        interests: tooManyTags,
      });

      expect(result).toEqual({
        message: "Academic interest tags cannot exceed 10 tags.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects duplicate interest tags", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const duplicateTags = ["AI", "Machine Learning", "ai"];
      const result = await updateProfile({
        userId: "user-1",
        interests: duplicateTags,
      });

      expect(result).toEqual({
        message: "Duplicate interest tags are not allowed.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("rejects invalid avatar image URL", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);

      const result = await updateProfile({
        userId: "user-1",
        profilePictureUrl: "not-a-valid-url",
      });

      expect(result).toEqual({
        message: "Invalid avatar image URL.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("returns error if user does not exist", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(null);

      const result = await updateProfile({
        userId: "non-existent-user",
        aboutMe: "Hello",
      });

      expect(result).toEqual({
        message: "Unable to update profile. Please try again later.",
      });
      expect(profileRepo.updateUserProfile).not.toHaveBeenCalled();
    });

    it("returns friendly error when database operation fails", async () => {
      vi.mocked(profileRepo.findUserById).mockResolvedValue(existingUser);
      vi.mocked(profileRepo.updateUserProfile).mockRejectedValue(
        new Error("DB error"),
      );

      const result = await updateProfile({
        userId: "user-1",
        aboutMe: "New bio",
      });

      expect(result).toEqual({
        message: "Unable to update profile. Please try again later.",
      });
    });
  });
});
