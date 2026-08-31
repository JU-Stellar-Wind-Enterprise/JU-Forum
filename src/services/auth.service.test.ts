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
    // --------------------------------------------------------
    // SIGNUP TEST 4
    // Account already exists with OTP_PENDING status
    // --------------------------------------------------------

    it("returns awaiting verification message if account already exists with OTP_PENDING", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "pending@juniv.edu",
        status: "OTP_PENDING" as AccountStatus,
      } as unknown as User);

      const res = await signup({
        name: "Pending User",
        email: "PENDING@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(usersRepo.findByEmail).toHaveBeenCalledWith("pending@juniv.edu");

      expect(res).toEqual({
        message: "This email is awaiting verification.",
        email: "pending@juniv.edu",
      });

      expect(usersRepo.createPending).not.toHaveBeenCalled();
    });

    // --------------------------------------------------------
    // SIGNUP TEST 5
    // Account already exists with ACTIVE status
    // --------------------------------------------------------

    it("returns already exists message if account already exists with ACTIVE status", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-2",
        email: "active@juniv.edu",
        status: "ACTIVE" as AccountStatus,
      } as unknown as User);

      const res = await signup({
        name: "Active User",
        email: "active@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "An account with this email already exists.",
      });

      expect(usersRepo.createPending).not.toHaveBeenCalled();
    });

    // --------------------------------------------------------
    // SIGNUP TEST 6
    // Successful signup
    // Password is hashed, user is created, and OTP is sent
    // --------------------------------------------------------

    it("hashes password, creates pending user, sends OTP email, and returns success", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_pass_123" as never);

      vi.mocked(usersRepo.createPending).mockResolvedValue({
        id: "u-new",
        name: "New Student",
        email: "newstudent@juniv.edu",
        role: "STUDENT" as UserRole,
        status: "OTP_PENDING" as AccountStatus,
      } as unknown as User);

      vi.mocked(sendOtpEmail).mockResolvedValue(undefined);

      const res = await signup({
        name: "  New Student  ",
        email: "  NewStudent@juniv.edu  ",
        password: "securepassword",
        role: "STUDENT",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("securepassword", 10);

      expect(usersRepo.createPending).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Student",
          email: "newstudent@juniv.edu",
          passwordHash: "hashed_pass_123",
          role: "STUDENT",
          otpCode: expect.stringMatching(/^\d{6}$/),
          otpExpiresAt: expect.any(Date),
        }),
      );

      expect(sendOtpEmail).toHaveBeenCalledWith(
        "newstudent@juniv.edu",
        expect.stringMatching(/^\d{6}$/),
      );

      expect(res).toEqual({
        success: true,
        email: "newstudent@juniv.edu",
      });
    });

    // --------------------------------------------------------
    // SIGNUP TEST 7
    // Mailer fails while sending OTP
    // --------------------------------------------------------

    it("handles mailer failure gracefully with an error result", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      vi.mocked(bcrypt.hash).mockResolvedValue("hashed_pass_123" as never);

      vi.mocked(usersRepo.createPending).mockResolvedValue({
        id: "u-new",
        name: "New Student",
        email: "newstudent@juniv.edu",
      } as unknown as User);

      vi.mocked(sendOtpEmail).mockRejectedValue(
        new Error("SMTP Connection Failed"),
      );

      const res = await signup({
        name: "New Student",
        email: "newstudent@juniv.edu",
        password: "securepassword",
        role: "STUDENT",
      });

      expect(res).toEqual({
        message: "Could not send the OTP email. Check SMTP settings.",
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
    // ==========================================================
    // 5. VERIFY OTP TESTS
    // Total: 5 tests
    // ==========================================================

    describe("verifyOtp", () => {
      // --------------------------------------------------------
      // VERIFY OTP TEST 1
      // User does not exist
      // --------------------------------------------------------

      it("returns error if user is not found", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

        const res = await verifyOtp("nobody@juniv.edu", "123456");

        expect(res).toEqual({
          message: "Invalid or expired OTP.",
        });

        expect(usersRepo.activate).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // VERIFY OTP TEST 2
      // User status is not OTP_PENDING
      // --------------------------------------------------------

      it("returns error if user status is not OTP_PENDING", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "user@juniv.edu",
          status: "ACTIVE" as AccountStatus,
          otpCode: "123456",
          otpExpiresAt: new Date(Date.now() + 60_000),
        } as unknown as User);

        const res = await verifyOtp("user@juniv.edu", "123456");

        expect(res).toEqual({
          message: "Invalid or expired OTP.",
        });

        expect(usersRepo.activate).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // VERIFY OTP TEST 3
      // OTP code does not match
      // --------------------------------------------------------

      it("returns error if OTP code does not match", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "user@juniv.edu",
          status: "OTP_PENDING" as AccountStatus,
          otpCode: "123456",
          otpExpiresAt: new Date(Date.now() + 60_000),
        } as unknown as User);

        const res = await verifyOtp("user@juniv.edu", "654321");

        expect(res).toEqual({
          message: "Invalid or expired OTP.",
        });

        expect(usersRepo.activate).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // VERIFY OTP TEST 4
      // OTP has expired
      // --------------------------------------------------------

      it("returns error if OTP is expired", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "user@juniv.edu",
          status: "OTP_PENDING" as AccountStatus,
          otpCode: "123456",
          otpExpiresAt: new Date(Date.now() - 1000),
        } as unknown as User);

        const res = await verifyOtp("user@juniv.edu", "123456");

        expect(res).toEqual({
          message: "Invalid or expired OTP.",
        });

        expect(usersRepo.activate).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // VERIFY OTP TEST 5
      // Valid OTP
      // User is activated and session is created
      // --------------------------------------------------------

      it("activates user, creates session, and returns success for valid OTP", async () => {
        const activeUser = {
          id: "u-1",
          name: "User One",
          email: "user@juniv.edu",
          role: "STUDENT" as UserRole,
          status: "ACTIVE" as AccountStatus,
        };

        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "user@juniv.edu",
          status: "OTP_PENDING" as AccountStatus,
          otpCode: "123456",
          otpExpiresAt: new Date(Date.now() + 60_000),
        } as unknown as User);

        vi.mocked(usersRepo.activate).mockResolvedValue(
          activeUser as unknown as User,
        );

        const res = await verifyOtp(" USER@JUNIV.EDU ", "123456");

        expect(usersRepo.findByEmail).toHaveBeenCalledWith("user@juniv.edu");

        expect(usersRepo.activate).toHaveBeenCalledWith("u-1");

        expect(createSession).toHaveBeenCalledWith({
          id: "u-1",
          name: "User One",
          email: "user@juniv.edu",
          role: "STUDENT",
          status: "ACTIVE",
        });

        expect(res).toEqual({
          success: true,
        });
      });
    });
    // ==========================================================
    // 6. RESEND OTP TESTS
    // Total: 3 tests
    // ==========================================================

    describe("resendOtp", () => {
      // --------------------------------------------------------
      // RESEND OTP TEST 1
      // User does not exist
      // --------------------------------------------------------

      it("returns error if user is not found", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

        const res = await resendOtp("missing@juniv.edu");

        expect(res).toEqual({
          message: "No pending signup was found.",
        });

        expect(usersRepo.updateOtp).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // RESEND OTP TEST 2
      // User is not OTP_PENDING
      // --------------------------------------------------------

      it("returns error if user is not OTP_PENDING", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "active@juniv.edu",
          status: "ACTIVE" as AccountStatus,
        } as unknown as User);

        const res = await resendOtp("active@juniv.edu");

        expect(res).toEqual({
          message: "No pending signup was found.",
        });

        expect(usersRepo.updateOtp).not.toHaveBeenCalled();
      });

      // --------------------------------------------------------
      // RESEND OTP TEST 3
      // Valid pending user receives a new OTP
      // --------------------------------------------------------

      it("updates OTP and sends email for valid pending user", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "pending@juniv.edu",
          status: "OTP_PENDING" as AccountStatus,
        } as unknown as User);

        vi.mocked(usersRepo.updateOtp).mockResolvedValue({} as unknown as User);

        vi.mocked(sendOtpEmail).mockResolvedValue(undefined);

        const res = await resendOtp(" PENDING@juniv.edu ");

        expect(usersRepo.findByEmail).toHaveBeenCalledWith("pending@juniv.edu");

        expect(usersRepo.updateOtp).toHaveBeenCalledWith(
          "u-1",
          expect.stringMatching(/^\d{6}$/),
          expect.any(Date),
        );

        expect(sendOtpEmail).toHaveBeenCalledWith(
          "pending@juniv.edu",
          expect.stringMatching(/^\d{6}$/),
        );

        expect(res).toEqual({
          success: true,
        });
      });
    });

    describe("login", () => {
      // --------------------------------------------------------
      // LOGIN TEST 1
      // User does not exist
      // --------------------------------------------------------

      it("returns invalid credentials if user is not found", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

        const res = await login("missing@juniv.edu", "pass123");

        expect(res).toEqual({
          message: "Invalid email or password.",
        });
      });

      // --------------------------------------------------------
      // LOGIN TEST 2
      // User account is soft-deleted
      // --------------------------------------------------------

      it("returns invalid credentials if user is soft-deleted", async () => {
        vi.mocked(usersRepo.findByEmail).mockResolvedValue({
          id: "u-1",
          email: "deleted@juniv.edu",
          isDeleted: true,
        } as unknown as User);

        const res = await login("deleted@juniv.edu", "pass123");

        expect(res).toEqual({
          message: "Invalid email or password.",
        });
      });
    });
    // --------------------------------------------------------
    // LOGIN TEST 3
    // Account is currently locked
    // --------------------------------------------------------

    it("returns locked message if lockoutUntil is in future", async () => {
      const lockoutTime = new Date(Date.now() + 10 * 60 * 1000);

      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "locked@juniv.edu",
        isDeleted: false,
        lockoutUntil: lockoutTime,
      } as unknown as User);

      const res = await login("locked@juniv.edu", "pass123");

      expect(res).toEqual({
        message: `Account locked until ${lockoutTime.toLocaleTimeString()}.`,
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    // --------------------------------------------------------
    // LOGIN TEST 4
    // User must verify OTP first
    // --------------------------------------------------------

    it("returns OTP verification required message if status is OTP_PENDING", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "pending@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "OTP_PENDING" as AccountStatus,
      } as unknown as User);

      const res = await login("pending@juniv.edu", "pass123");

      expect(res).toEqual({
        message: "Verify your email OTP first to finish signing in.",
        email: "pending@juniv.edu",
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    // --------------------------------------------------------
    // LOGIN TEST 5
    // Account is suspended or inactive
    // --------------------------------------------------------

    it("returns account not active message if status is suspended or other non-ACTIVE", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "suspended@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "SUSPENDED" as AccountStatus,
      } as unknown as User);

      const res = await login("suspended@juniv.edu", "pass123");

      expect(res).toEqual({
        message: "This account is not active.",
        email: undefined,
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    // --------------------------------------------------------
    // LOGIN TEST 6
    // Wrong password with fewer than 5 failed attempts
    // --------------------------------------------------------

    it("increments failedLoginAttempts and returns invalid credentials on wrong password (< 5 attempts)", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "user@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "ACTIVE" as AccountStatus,
        passwordHash: "correct_hash",
        failedLoginAttempts: 2,
      } as unknown as User);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await login("user@juniv.edu", "wrongpass");

      expect(usersRepo.updateLogin).toHaveBeenCalledWith("u-1", {
        failedLoginAttempts: 3,
      });

      expect(res).toEqual({
        message: "Invalid email or password.",
      });
    });

    // --------------------------------------------------------
    // LOGIN TEST 7
    // Account is locked after 5 failed attempts
    // --------------------------------------------------------

    it("locks account after 5 failed attempts and returns lockout message", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "u-1",
        email: "user@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "ACTIVE" as AccountStatus,
        passwordHash: "correct_hash",
        failedLoginAttempts: 4,
      } as unknown as User);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await login("user@juniv.edu", "wrongpass");

      expect(usersRepo.updateLogin).toHaveBeenCalledWith("u-1", {
        failedLoginAttempts: 5,
        lockoutUntil: expect.any(Date),
      });

      expect(res.message).toMatch(/^Too many attempts\. Try again after /);
    });

    // --------------------------------------------------------
    // LOGIN TEST 8
    // Successful login with correct password
    // --------------------------------------------------------

    it("resets failedLoginAttempts, creates session, and returns success on valid credentials", async () => {
      const user = {
        id: "u-1",
        name: "Good User",
        email: "good@juniv.edu",
        role: "STUDENT" as UserRole,
        isDeleted: false,
        lockoutUntil: null,
        status: "ACTIVE" as AccountStatus,
        passwordHash: "correct_hash",
        failedLoginAttempts: 3,
      };

      vi.mocked(usersRepo.findByEmail).mockResolvedValue(
        user as unknown as User,
      );

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const res = await login("good@juniv.edu", "correctpass");

      expect(usersRepo.updateLogin).toHaveBeenCalledWith("u-1", {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      });

      expect(createSession).toHaveBeenCalledWith({
        id: "u-1",
        name: "Good User",
        email: "good@juniv.edu",
        role: "STUDENT",
        status: "ACTIVE",
      });

      expect(res).toEqual({
        success: true,
      });
    });
  });
});
