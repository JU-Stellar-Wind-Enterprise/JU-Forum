import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendOtpEmail } from "@/lib/mailer";
import { createSession } from "@/lib/session";
import * as usersRepo from "@/repositories/user.repository";

import { login, signup, verifyOtp } from "./auth.service";

// Mock repository
vi.mock("@/repositories/user.repository", () => ({
  findByEmail: vi.fn(),
  createPending: vi.fn(),
  activate: vi.fn(),
  updateLogin: vi.fn(),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock email
vi.mock("@/lib/mailer", () => ({
  sendOtpEmail: vi.fn(),
}));

// Mock session
vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
}));

describe("auth.service", () => {
  // Clear mocks before every test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. SIGNUP TESTS - 8 TESTS
  // ==========================================

  describe("signup", () => {
    // Test 1: Invalid email
    it("should return error for invalid email", async () => {
      const result = await signup({
        name: "Test User",
        email: "test@gmail.com",
        password: "password123",
        role: "STUDENT",
      });

      expect(result.message).toBe("Use your @juniv.edu email address.");
    });

    // Test 2: Short password
    it("should return error for short password", async () => {
      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "12345",
        role: "STUDENT",
      });

      expect(result.message).toBe("Password must be at least 6 characters.");
    });

    // Test 3: Empty name
    it("should return error if name is empty", async () => {
      const result = await signup({
        name: "",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result.message).toBe("Name is required.");
    });

    // Test 4: Email already exists
    it("should return error if email already exists", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "ACTIVE",
      });

      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result.message).toBe("An account with this email already exists.");
    });

    // Test 5: Pending email
    it("should return error if email is waiting for verification", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "OTP_PENDING",
      });

      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result).toEqual({
        message: "This email is awaiting verification.",
        email: "test@juniv.edu",
      });
    });

    // Test 6: Successful signup
    it("should signup successfully with valid information", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashedPassword");

      (usersRepo.createPending as any).mockResolvedValue({
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
      });

      (sendOtpEmail as any).mockResolvedValue(undefined);

      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result).toEqual({
        success: true,
        email: "test@juniv.edu",
      });

      expect(sendOtpEmail).toHaveBeenCalled();
    });

    // Test 7: Name contains only spaces
    it("should return error if name contains only spaces", async () => {
      const result = await signup({
        name: "   ",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result.message).toBe("Name is required.");
    });

    // Test 8: Email sending failure
    it("should return error if OTP email sending fails", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashedPassword");

      (usersRepo.createPending as any).mockResolvedValue({
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
      });

      (sendOtpEmail as any).mockRejectedValue(
        new Error("Email sending failed"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result.message).toBe(
        "Could not send the OTP email. Check SMTP settings.",
      );

      consoleSpy.mockRestore();
    });
  });

  // ==========================================
  // 2. VERIFY OTP TESTS - 5 TESTS
  // ==========================================

  describe("verifyOtp", () => {
    // Test 1: User does not exist
    it("should return error if user does not exist", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue(null);

      const result = await verifyOtp("test@juniv.edu", "123456");

      expect(result.message).toBe("Invalid or expired OTP.");
    });

    // Test 2: User is not waiting for verification
    it("should return error if user is not OTP_PENDING", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "ACTIVE",
        otpCode: "123456",
        otpExpiresAt: new Date(Date.now() + 60000),
      });

      const result = await verifyOtp("test@juniv.edu", "123456");

      expect(result.message).toBe("Invalid or expired OTP.");
    });

    // Test 3: Wrong OTP
    it("should return error for incorrect OTP", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "OTP_PENDING",
        otpCode: "123456",
        otpExpiresAt: new Date(Date.now() + 60000),
      });

      const result = await verifyOtp("test@juniv.edu", "654321");

      expect(result.message).toBe("Invalid or expired OTP.");
    });

    // Test 4: Expired OTP
    it("should return error if OTP has expired", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "OTP_PENDING",
        otpCode: "123456",
        otpExpiresAt: new Date(Date.now() - 1000),
      });

      const result = await verifyOtp("test@juniv.edu", "123456");

      expect(result.message).toBe("Invalid or expired OTP.");
    });

    // Test 5: Successful OTP verification
    it("should verify OTP and activate the account", async () => {
      const user = {
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
        role: "STUDENT",
        status: "ACTIVE",
      };

      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "OTP_PENDING",
        otpCode: "123456",
        otpExpiresAt: new Date(Date.now() + 60000),
      });

      (usersRepo.activate as any).mockResolvedValue(user);

      const result = await verifyOtp("test@juniv.edu", "123456");

      expect(usersRepo.activate).toHaveBeenCalledWith("1");
      expect(createSession).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
      });
    });
  });

  // ==========================================
  // 3. LOGIN TESTS - 8 TESTS
  // ==========================================

  describe("login", () => {
    // Test 1: User does not exist
    it("should return error if user does not exist", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue(null);

      const result = await login("test@juniv.edu", "password123");

      expect(result.message).toBe("Invalid email or password.");
    });

    // Test 2: Wrong password
    it("should return error for wrong password", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        passwordHash: "hashedPassword",
        status: "ACTIVE",
        isDeleted: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await login("test@juniv.edu", "wrongpassword");

      expect(result.message).toBe("Invalid email or password.");
    });

    // Test 3: Correct password
    it("should login successfully with correct password", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
        passwordHash: "hashedPassword",
        status: "ACTIVE",
        isDeleted: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        role: "STUDENT",
      });

      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        success: true,
      });
    });

    // Test 4: Deleted account
    it("should return error if account is deleted", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        isDeleted: true,
      });

      const result = await login("test@juniv.edu", "password123");

      expect(result.message).toBe("Invalid email or password.");
    });

    // Test 5: Inactive account
    it("should return error if account is not active", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "SUSPENDED",
        isDeleted: false,
        lockoutUntil: null,
      });

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        message: "This account is not active.",
        email: undefined,
      });
    });

    // Test 6: Locked account
    it("should return error if account is locked", async () => {
      const lockTime = new Date(Date.now() + 10 * 60 * 1000);

      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        isDeleted: false,
        lockoutUntil: lockTime,
      });

      const result = await login("test@juniv.edu", "password123");

      expect(result.message).toBe(
        `Account locked until ${lockTime.toLocaleTimeString()}.`,
      );
    });

    // Test 7: OTP verification required
    it("should return error if OTP is not verified", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        isDeleted: false,
        lockoutUntil: null,
        status: "OTP_PENDING",
      });

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        message: "Verify your email OTP first to finish signing in.",
        email: "test@juniv.edu",
      });
    });

    // Test 8: Account locked after five wrong attempts
    it("should lock account after five failed attempts", async () => {
      (usersRepo.findByEmail as any).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        passwordHash: "hashedPassword",
        status: "ACTIVE",
        isDeleted: false,
        lockoutUntil: null,
        failedLoginAttempts: 4,
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await login("test@juniv.edu", "wrongpassword");

      expect(usersRepo.updateLogin).toHaveBeenCalledWith("1", {
        failedLoginAttempts: 5,
        lockoutUntil: expect.any(Date),
      });

      expect(result.message).toMatch(/^Too many attempts\. Try again after /);
    });
  });
});
