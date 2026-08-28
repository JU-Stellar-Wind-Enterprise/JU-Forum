import { prisma } from "@/lib/prisma";
import type { PublicRole } from "@/types/auth";

/** Finds a user by normalized email address. */
export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
/** Creates a user whose email verification is still pending. */
export const createPending = (data: {
  name: string;
  email: string;
  passwordHash: string;
  role: PublicRole;
  otpCode: string;
  otpExpiresAt: Date;
}) => prisma.user.create({ data: { ...data, status: "OTP_PENDING" } });
/** Replaces a pending user's OTP and expiration time. */
export const updateOtp = (id: string, otpCode: string, otpExpiresAt: Date) =>
  prisma.user.update({ where: { id }, data: { otpCode, otpExpiresAt } });
/** Activates a user and clears their consumed OTP fields. */
export const activate = (id: string) =>
  prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", otpCode: null, otpExpiresAt: null },
  });
/** Updates failed-attempt and lockout state after a login attempt. */
export const updateLogin = (
  id: string,
  data: { failedLoginAttempts?: number; lockoutUntil?: Date | null },
) => prisma.user.update({ where: { id }, data });
