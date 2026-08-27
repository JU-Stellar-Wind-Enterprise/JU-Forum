import bcrypt from "bcryptjs";
import type { AccountStatus, UserRole } from "@/generated/prisma/client";
import { sendOtpEmail } from "@/lib/mailer";
import { createSession } from "@/lib/session";
import * as users from "@/repositories/user.repository";
import type { PublicRole, SafeUser } from "@/types/auth";

const otp = () => Math.floor(100000 + Math.random() * 900000).toString();
const normalize = (email: string) => email.trim().toLowerCase();
const safe = (u: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
}): SafeUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});

/**
 * Registers a pending JU account and sends its initial email OTP.
 *
 * @param input - The user's name, JU email, plain-text password, and public role.
 * @returns A success result with the normalized email, or a user-facing error result.
 * @throws If an unexpected password-hashing or database operation fails.
 */
export async function signup(input: {
  name: string;
  email: string;
  password: string;
  role: PublicRole;
}) {
  const email = normalize(input.email);
  if (!email.endsWith("@juniv.edu"))
    return { message: "Use your @juniv.edu email address." };
  if (input.password.length < 6)
    return { message: "Password must be at least 6 characters." };
  if (!input.name.trim()) return { message: "Name is required." };
  const existing = await users.findByEmail(email);
  if (existing)
    return existing.status === "OTP_PENDING"
      ? {
          message: "This email is awaiting verification.",
          email: existing.email,
        }
      : { message: "An account with this email already exists." };
  const code = otp();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await users.createPending({
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role,
    otpCode: code,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    console.error(error);
    return { message: "Could not send the OTP email. Check SMTP settings." };
  }
  return { success: true, email: user.email };
}

/**
 * Activates a pending account when its unexpired OTP matches.
 *
 * @param emailInput - The account email; surrounding whitespace and case are normalized.
 * @param code - The six-digit one-time password submitted by the user.
 * @returns A success result after session creation, or an invalid/expired OTP result.
 * @throws If the database cannot update the user or the session cookie cannot be set.
 */
export async function verifyOtp(emailInput: string, code: string) {
  const user = await users.findByEmail(normalize(emailInput));
  if (
    !user ||
    user.status !== "OTP_PENDING" ||
    user.otpCode !== code ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  )
    return { message: "Invalid or expired OTP." };
  const active = await users.activate(user.id);
  await createSession(safe(active));
  return { success: true };
}

/**
 * Replaces and emails the OTP for an account awaiting verification.
 *
 * @param emailInput - The pending account email to normalize and look up.
 * @returns A success result, or a result stating that no pending signup exists.
 * @throws If updating the OTP or sending the email fails.
 */
export async function resendOtp(emailInput: string) {
  const user = await users.findByEmail(normalize(emailInput));
  if (!user || user.status !== "OTP_PENDING")
    return { message: "No pending signup was found." };
  const code = otp();
  await users.updateOtp(user.id, code, new Date(Date.now() + 10 * 60 * 1000));
  await sendOtpEmail(user.email, code);
  return { success: true };
}

/**
 * Authenticates an active account and creates its signed session cookie.
 *
 * @param emailInput - The account email to normalize before lookup.
 * @param password - The plain-text password to compare with the stored hash.
 * @returns A success result, or a user-facing authentication or lockout result.
 * @throws If password comparison, database updates, or session creation unexpectedly fail.
 */
export async function login(emailInput: string, password: string) {
  const user = await users.findByEmail(normalize(emailInput));
  if (!user || user.isDeleted) return { message: "Invalid email or password." };
  if (user.lockoutUntil && user.lockoutUntil > new Date())
    return {
      message: `Account locked until ${user.lockoutUntil.toLocaleTimeString()}.`,
    };
  if (user.status !== "ACTIVE")
    return {
      message:
        user.status === "OTP_PENDING"
          ? "Verify your email OTP first to finish signing in."
          : "This account is not active.",
      email: user.status === "OTP_PENDING" ? user.email : undefined,
    };
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= 5) {
      const until = new Date(Date.now() + 15 * 60 * 1000);
      await users.updateLogin(user.id, {
        failedLoginAttempts: attempts,
        lockoutUntil: until,
      });
      return {
        message: `Too many attempts. Try again after ${until.toLocaleTimeString()}.`,
      };
    }
    await users.updateLogin(user.id, { failedLoginAttempts: attempts });
    return { message: "Invalid email or password." };
  }
  await users.updateLogin(user.id, {
    failedLoginAttempts: 0,
    lockoutUntil: null,
  });
  await createSession(safe(user));
  return { success: true };
}