"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";
import * as auth from "@/services/auth.service";
import type { PublicRole } from "@/types/auth";

function roleFromForm(value: string): PublicRole {
  return value === "FACULTY" || value === "STAFF" ? value : "STUDENT";
}

/**
 * Handles a signup form submission and starts email verification.
 *
 * @param _ - The previous form state supplied by React. It is unused.
 * @param form - Untrusted signup form data containing name, email, password, and role.
 * @returns The signup result when validation fails or the account needs attention.
 * @throws A Next.js redirect signal after a signup succeeds.
 */
export async function signupAction(_: unknown, form: FormData) {
  const result = await auth.signup({
    name: String(form.get("name") || ""),
    email: String(form.get("email") || ""),
    password: String(form.get("password") || ""),
    role: roleFromForm(String(form.get("role") || "STUDENT")),
  });
  if (result.success)
    redirect(`/verify-otp?email=${encodeURIComponent(result.email || "")}`);
  return result;
}

/**
 * Verifies the one-time password submitted for a pending account.
 *
 * @param _ - The previous form state supplied by React. It is unused.
 * @param form - Untrusted form data containing the email address and OTP code.
 * @returns The verification result when the OTP cannot be accepted.
 * @throws A Next.js redirect signal after verification succeeds.
 */
export async function verifyOtpAction(_: unknown, form: FormData) {
  const result = await auth.verifyOtp(
    String(form.get("email") || ""),
    String(form.get("code") || ""),
  );
  if (result.success) redirect("/");
  return result;
}

/**
 * Requests and emails a replacement OTP for a pending signup.
 *
 * @param _ - The previous form state supplied by React. It is unused.
 * @param form - Untrusted form data containing the pending account's email address.
 * @returns A serializable result describing whether the OTP was resent.
 */
export async function resendOtpAction(_: unknown, form: FormData) {
  try {
    return await auth.resendOtp(String(form.get("email") || ""));
  } catch {
    return { message: "Could not resend OTP." };
  }
}

/**
 * Authenticates credentials submitted through the login form.
 *
 * @param _ - The previous form state supplied by React. It is unused.
 * @param form - Untrusted form data containing an email address and password.
 * @returns The login result when authentication does not succeed.
 * @throws A Next.js redirect signal after authentication succeeds.
 */
export async function loginAction(_: unknown, form: FormData) {
  const result = await auth.login(
    String(form.get("email") || ""),
    String(form.get("password") || ""),
  );
  if (result.success) redirect("/");
  return result;
}

/**
 * Signs out the current user by deleting the session cookie.
 *
 * @returns This function does not return because successful logout redirects.
 * @throws A Next.js redirect signal that sends the browser to the login page.
 */
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
