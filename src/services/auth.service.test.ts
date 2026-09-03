import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountStatus, User, UserRole } from "@/generated/prisma/client";

import { sendOtpEmail } from "@/lib/mailer";
import { createSession } from "@/lib/session";
import * as usersRepo from "@/repositories/user.repository";

import { login, signup } from "./auth.service";

// ============================================================
// MOCKS
// ============================================================

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/mailer", () => ({
  sendOtpEmail: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => ({
  findByEmail: vi.fn(),
  createPending: vi.fn(),
  activate: vi.fn(),
  updateOtp: vi.fn(),
  updateLogin: vi.fn(),
}));

// ============================================================
// AUTH SERVICE TESTS
// ============================================================

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================
  // SIGNUP - 5 TESTS
  // ==========================================================

  describe("signup", () => {
    // 1. Invalid email
    it("returns error for invalid email", async () => {
      const res = await signup({
        name: "Test User",
        email: "test@gmail.com",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Use your @juniv.edu email address.",
      });
    });

    // 2. Short password
    it("returns error for short password", async () => {
      const res = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "12345",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Password must be at least 6 characters.",
      });
    });

    // 3. Empty name
    it("returns error for empty name", async () => {
      const res = await signup({
        name: "",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Name is required.",
      });
    });

    // 4. Existing account
    it("returns error if account already exists", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "test@juniv.edu",
        status: "ACTIVE" as AccountStatus,
      } as unknown as User);

      const res = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "An account with this email already exists.",
      });
    });

    // 5. Successful signup
    it("successfully creates a new account", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);

      vi.mocked(usersRepo.createPending).mockResolvedValue(
        {} as unknown as User,
      );

      vi.mocked(sendOtpEmail).mockResolvedValue(undefined);

      const res = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(usersRepo.createPending).toHaveBeenCalled();
      expect(sendOtpEmail).toHaveBeenCalled();

      expect(res).toEqual({
        success: true,
        email: "test@juniv.edu",
      });
    });
  });

  // ==========================================================
  // LOGIN - 5 TESTS
  // ==========================================================

  describe("login", () => {
    // 1. User not found
    it("returns error if user does not exist", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      const res = await login("test@juniv.edu", "password123");

      expect(res).toEqual({
        message: "Invalid email or password.",
      });
    });

    // 2. Deleted account
    it("returns error for deleted account", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "test@juniv.edu",
        isDeleted: true,
      } as unknown as User);

      const res = await login("test@juniv.edu", "password123");

      expect(res).toEqual({
        message: "Invalid email or password.",
      });
    });

    // 3. OTP pending
    it("returns error if OTP verification is pending", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "test@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "OTP_PENDING" as AccountStatus,
      } as unknown as User);

      const res = await login("test@juniv.edu", "password123");

      expect(res).toEqual({
        message: "Verify your email OTP first to finish signing in.",
        email: "test@juniv.edu",
      });
    });

    // 4. Wrong password
    it("returns error for wrong password", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "test@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "ACTIVE" as AccountStatus,
        passwordHash: "hashed_password",
        failedLoginAttempts: 0,
      } as unknown as User);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await login("test@juniv.edu", "wrongpassword");

      expect(res).toEqual({
        message: "Invalid email or password.",
      });
    });

    // 5. Successful login
    it("successfully logs in with correct password", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        name: "Test User",
        email: "test@juniv.edu",
        role: "STUDENT" as UserRole,
        isDeleted: false,
        lockoutUntil: null,
        status: "ACTIVE" as AccountStatus,
        passwordHash: "hashed_password",
        failedLoginAttempts: 0,
      } as unknown as User);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const res = await login("test@juniv.edu", "password123");

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(createSession).toHaveBeenCalled();

      expect(res).toEqual({
        success: true,
      });
    });
  });
});
