import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as usersRepo from "@/repositories/user.repository";

import { login, signup } from "./auth.service";

// Mock repository
vi.mock("@/repositories/user.repository", () => ({
  findByEmail: vi.fn(),
  createPending: vi.fn(),
  updateLogin: vi.fn(),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================================================
  // SIGN UP TESTS - 5 SIMPLE TESTS
  // ==================================================

  describe("signup", () => {
    // Test 1: Invalid email
    it("should return error for invalid email", async () => {
      const result = await signup({
        name: "Test User",
        email: "test@gmail.com",
        password: "password123",
        role: "STUDENT",
      });

      expect(result).toEqual({
        message: "Use your @juniv.edu email address.",
      });
    });

    // Test 2: Short password
    it("should return error for short password", async () => {
      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "12345",
        role: "STUDENT",
      });

      expect(result).toEqual({
        message: "Password must be at least 6 characters.",
      });
    });

    // Test 3: Empty name
    it("should return error if name is empty", async () => {
      const result = await signup({
        name: "",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result).toEqual({
        message: "Name is required.",
      });
    });

    // Test 4: Email already exists
    it("should return error if email already exists", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "ACTIVE",
      } as any);

      const result = await signup({
        name: "Test User",
        email: "test@juniv.edu",
        password: "password123",
        role: "STUDENT",
      });

      expect(result).toEqual({
        message: "An account with this email already exists.",
      });
    });

    // Test 5: Successful signup
    it("should signup successfully with valid information", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);

      vi.mocked(usersRepo.createPending).mockResolvedValue({
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
      } as any);

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
    });
  });

  // ==================================================
  // LOGIN TESTS - 5 SIMPLE TESTS
  // ==================================================

  describe("login", () => {
    // Test 1: User does not exist
    it("should return error if user does not exist", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue(null);

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        message: "Invalid email or password.",
      });
    });

    // Test 2: Wrong password
    it("should return error for wrong password", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        passwordHash: "hashedPassword",
        status: "ACTIVE",
        isDeleted: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await login("test@juniv.edu", "wrongpassword");

      expect(result).toEqual({
        message: "Invalid email or password.",
      });
    });

    // Test 3: Correct password
    it("should login successfully with correct password", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "1",
        name: "Test User",
        email: "test@juniv.edu",
        passwordHash: "hashedPassword",
        status: "ACTIVE",
        isDeleted: false,
        lockoutUntil: null,
        failedLoginAttempts: 0,
        role: "STUDENT",
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        success: true,
      });
    });

    // Test 4: Deleted account
    it("should return error if account is deleted", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        isDeleted: true,
      } as any);

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        message: "Invalid email or password.",
      });
    });

    // Test 5: Inactive account
    it("should return error if account is not active", async () => {
      vi.mocked(usersRepo.findByEmail).mockResolvedValue({
        id: "1",
        email: "test@juniv.edu",
        status: "SUSPENDED",
        isDeleted: false,
        lockoutUntil: null,
      } as any);

      const result = await login("test@juniv.edu", "password123");

      expect(result).toEqual({
        message: "This account is not active.",
        email: undefined,
      });
    });
  });
});
