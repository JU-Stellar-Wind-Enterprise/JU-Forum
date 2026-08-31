import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { SafeUser } from "@/types/auth";

const COOKIE = "ju_forum_session";
const secret = () => process.env.SESSION_SECRET || "development-only-secret";
const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

/**
 * Creates a signed, HTTP-only session cookie that remains valid for seven days.
 *
 * @param user - The safe user projection whose ID identifies the session owner.
 * @returns A promise that resolves after the cookie has been written.
 * @throws If cookie access fails in the current request context.
 */
export async function createSession(user: SafeUser) {
  const value = `${user.id}.${Date.now() + 7 * 24 * 60 * 60 * 1000}`;
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

/**
 * Removes the current browser session cookie.
 *
 * @returns A promise that resolves after the cookie has been deleted.
 * @throws If cookie access fails in the current request context.
 */
export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/**
 * Verifies the signed session cookie and loads the current safe user projection.
 *
 * @returns The current user when the session is valid, or `null` otherwise.
 * @throws If the database lookup or cookie access unexpectedly fails.
 */
export async function getCurrentUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, expiry, signature] = raw.split(".");
  if (!id || !expiry || !signature || Number(expiry) < Date.now()) return null;
  const expected = sign(`${id}.${expiry}`);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
}
