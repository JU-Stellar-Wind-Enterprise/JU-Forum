import { prisma } from "@/lib/prisma";
import type { PublicRole } from "@/types/auth";

/**
 * Finds a user by their normalized email address.
 *
 * @param email - The lowercase, trimmed email used as the unique lookup key.
 * @returns The matching user, or `null` when the email is not registered.
 * @throws If the database query fails.
 */
export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
/**
 * Creates a user whose email verification is still pending.
 *
 * @param data - Identity, password hash, role, and initial OTP data for the user.
 * @returns The newly created pending user record.
 * @throws If the email is duplicated or the database write fails.
 */
export const createPending = (data: {
  name: string;
  email: string;
  passwordHash: string;
  role: PublicRole;
  otpCode: string;
  otpExpiresAt: Date;
}) => prisma.user.create({ data: { ...data, status: "OTP_PENDING" } });
/**
 * Replaces a pending user's OTP and expiration time.
 *
 * @param id - The unique ID of the pending user.
 * @param otpCode - The newly generated one-time password.
 * @param otpExpiresAt - The date and time after which the OTP is invalid.
 * @returns The updated user record.
 * @throws If the user does not exist or the database write fails.
 */
export const updateOtp = (id: string, otpCode: string, otpExpiresAt: Date) =>
  prisma.user.update({ where: { id }, data: { otpCode, otpExpiresAt } });
/**
 * Activates a user and clears the consumed OTP fields.
 *
 * @param id - The unique ID of the user who completed verification.
 * @returns The updated active user record.
 * @throws If the user does not exist or the database write fails.
 */
export const activate = (id: string) =>
  prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", otpCode: null, otpExpiresAt: null },
  });
/**
 * Updates failed-attempt and lockout state after a login attempt.
 *
 * @param id - The unique ID of the user whose login state is changing.
 * @param data - The attempt count and optional lockout expiration to store.
 * @returns The updated user record.
 * @throws If the user does not exist or the database write fails.
 */
export const updateLogin = (
  id: string,
  data: { failedLoginAttempts?: number; lockoutUntil?: Date | null },
) => prisma.user.update({ where: { id }, data });
