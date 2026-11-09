import { beforeEach, describe, expect, it, vi } from "vitest";
import * as subforumRepo from "@/repositories/subforum.repository";
import { isFollowingSubforum, toggleSubforumFollow } from "./subforum.service";

vi.mock("@/repositories/subforum.repository", () => ({
  findSubforumByName: vi.fn(),
  findSubforumById: vi.fn(),
  listSubforums: vi.fn(),
  createSubforum: vi.fn(),
  isUserFollowingSubforum: vi.fn(),
  followSubforum: vi.fn(),
  unfollowSubforum: vi.fn(),
}));

describe("subforum.service follow controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks whether a user follows a subforum", async () => {
    vi.mocked(subforumRepo.isUserFollowingSubforum).mockResolvedValue(true);

    const following = await isFollowingSubforum("user-1", "sub-1");

    expect(following).toBe(true);
    expect(subforumRepo.isUserFollowingSubforum).toHaveBeenCalledWith(
      "user-1",
      "sub-1",
    );
  });

  it("rejects follow toggle when userId is missing", async () => {
    const result = await toggleSubforumFollow({
      userId: "",
      subforumId: "sub-1",
    });

    expect(result).toEqual({ message: "You must be logged in." });
    expect(subforumRepo.findSubforumById).not.toHaveBeenCalled();
  });

  it("rejects follow toggle when subforum does not exist or is not approved", async () => {
    vi.mocked(subforumRepo.findSubforumById).mockResolvedValue(null);

    const missingResult = await toggleSubforumFollow({
      userId: "user-1",
      subforumId: "missing",
    });
    expect(missingResult).toEqual({ message: "Subforum not found." });

    vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
      id: "sub-pending",
      name: "Pending",
      description: "Waiting approval",
      isApproved: false,
      ownerId: "owner-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const unapprovedResult = await toggleSubforumFollow({
      userId: "user-1",
      subforumId: "sub-pending",
    });
    expect(unapprovedResult).toEqual({ message: "Subforum not found." });
  });

  it("follows an approved subforum when not currently followed", async () => {
    vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
      id: "sub-1",
      name: "CSE Discussion",
      description: "CSE topics",
      isApproved: true,
      ownerId: "owner-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(subforumRepo.isUserFollowingSubforum).mockResolvedValue(false);

    const result = await toggleSubforumFollow({
      userId: "user-1",
      subforumId: "sub-1",
    });

    expect(subforumRepo.followSubforum).toHaveBeenCalledWith("user-1", "sub-1");
    expect(result).toEqual({ success: true, data: { following: true } });
  });

  it("unfollows an approved subforum when already followed", async () => {
    vi.mocked(subforumRepo.findSubforumById).mockResolvedValue({
      id: "sub-1",
      name: "CSE Discussion",
      description: "CSE topics",
      isApproved: true,
      ownerId: "owner-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(subforumRepo.isUserFollowingSubforum).mockResolvedValue(true);

    const result = await toggleSubforumFollow({
      userId: "user-1",
      subforumId: "sub-1",
    });

    expect(subforumRepo.unfollowSubforum).toHaveBeenCalledWith(
      "user-1",
      "sub-1",
    );
    expect(result).toEqual({ success: true, data: { following: false } });
  });
});
