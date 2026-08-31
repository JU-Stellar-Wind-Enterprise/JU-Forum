// ============================================================
// 1. IMPORTS
// ============================================================

import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountStatus, User, UserRole } from "@/generated/prisma/client";

import { sendOtpEmail } from "@/lib/mailer";
import { createSession } from "@/lib/session";
import * as usersRepo from "@/repositories/user.repository";

import { login, resendOtp, signup, verifyOtp } from "./auth.service";

// ============================================================
// 2. MOCKS
// ============================================================

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock mailer
vi.mock("@/lib/mailer", () => ({
  sendOtpEmail: vi.fn(),
}));

// Mock session
vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
}));

// Mock user repository
vi.mock("@/repositories/user.repository", () => ({
  findByEmail: vi.fn(),
  createPending: vi.fn(),
  activate: vi.fn(),
  updateOtp: vi.fn(),
  updateLogin: vi.fn(),
}));

// ============================================================
// 3. MAIN TEST SUITE
// ============================================================

describe("auth.service", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    // --------------------------------------------------------
    // SIGNUP TEST 1
    // Invalid email domain
    // --------------------------------------------------------

    it("returns error if email does not end with @juniv.edu", async () => {
      const res = await signup({
        name: "Test User",
        email: "test@gmail.com",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Use your @juniv.edu email address.",
      });

      expect(usersRepo.findByEmail).not.toHaveBeenCalled();
    });

    // --------------------------------------------------------
    // SIGNUP TEST 2
    // Password is less than 6 characters
    // --------------------------------------------------------

    it("returns error if password is less than 6 characters", async () => {
      const res = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "12345",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Password must be at least 6 characters.",
      });

      expect(usersRepo.findByEmail).not.toHaveBeenCalled();
    });
    // --------------------------------------------------------
    // SIGNUP TEST 3
    // Name is empty or contains only spaces
    // --------------------------------------------------------

    it("returns error if name is empty or whitespace", async () => {
      const res = await signup({
        name: "   ",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Name is required.",
      });

      expect(usersRepo.findByEmail).not.toHaveBeenCalled();
    });
  });
});
