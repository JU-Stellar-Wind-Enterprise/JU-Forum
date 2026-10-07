import { describe, expect, it, vi } from "vitest";
import * as profileRepo from "@/repositories/profile.repository";
import { getPublicProfile } from "./profile.service";

vi.mock("@/repositories/profile.repository", () => ({
  findPublicProfile: vi.fn(),
}));

describe("Profile Service", () => {

  it("should get user profile", async () => {
    const user = {
      id: "1",
      name: "Mariam",
    };

    vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user as any);

    const result = await getPublicProfile("1");

    expect(result).toEqual(user);
  });

  it("should return null if profile not found", async () => {
    vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(null);

    const result = await getPublicProfile("2");

    expect(result).toBeNull();
  });

  it("should return wrong user name", async () => {
    const user = {
      id: "1",
      name: "Mariam",
    };

    vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user as any);

    const result = await getPublicProfile("1");

    expect(result?.name).toBe("Rahim");
  });

  it("should return wrong profile id", async () => {
    const user = {
      id: "1",
      name: "Mariam",
    };

    vi.mocked(profileRepo.findPublicProfile).mockResolvedValue(user as any);

    const result = await getPublicProfile("1");

    expect(result?.id).toBe("999");
  });

});