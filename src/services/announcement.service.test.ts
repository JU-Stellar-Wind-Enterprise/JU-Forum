import { describe, expect, it } from "vitest";
import { canCreateAnnouncement } from "./announcement.service";

describe("announcement.service", () => {
  describe("canCreateAnnouncement", () => {
    it("returns true for authorized roles", () => {
      const allowedRoles = [
        "FACULTY",
        "STAFF",
        "MODERATOR",
        "ADMIN",
        "SYSTEM_ADMIN",
      ];

      for (const role of allowedRoles) {
        expect(canCreateAnnouncement(role)).toBe(true);
      }
    });
  });
});
it("returns false for unauthorized roles", () => {
  expect(canCreateAnnouncement("STUDENT" as UserRole)).toBe(false);
});
describe("canCreateAnnouncement", () => {
  it("returns true for authorized roles", () => {
    const allowedRoles = [
      "FACULTY",
      "STAFF",
      "MODERATOR",
      "ADMIN",
      "SYSTEM_ADMIN",
    ];

    for (const role of allowedRoles) {
      expect(canCreateAnnouncement(role)).toBe(true);
    }
  });

  it("returns false for unauthorized roles", () => {
    expect(canCreateAnnouncement("STUDENT" as UserRole)).toBe(false);
  });
});