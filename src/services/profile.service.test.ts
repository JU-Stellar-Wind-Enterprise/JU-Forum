import { describe, expect, it, vi } from "vitest";
import * as profileRepo from "@/repositories/profile.repository";
import { getPublicProfile } from "./profile.service";

vi.mock("@/repositories/profile.repository", () => ({
  findPublicProfile: vi.fn(),
}));

describe("profile.service", () => {
  describe("getPublicProfile", () => {
    it("delegates to findPublicProfile and returns the user profile", async () => {
      const mockProfile = {
        id: "user-1",
        name: "Test User",
        email: "user@juniv.edu",
        role: "STUDENT" as const,
        batch: "49",
        nickname: "tester",
        profilePictureUrl: null,
        aboutMe: "Hello",
        status: "ACTIVE" as const,
        createdAt: new Date(),
      };
      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(mockProfile);

      const result = await getPublicProfile("user-1");

      expect(profileRepo.findPublicProfile).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(mockProfile);
    });

    it("returns null when profile does not exist", async () => {
      vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(null);

      const result = await getPublicProfile("non-existent");

      expect(profileRepo.findPublicProfile).toHaveBeenCalledWith(
        "non-existent",
      );
      expect(result).toBeNull();
    });
  });
});