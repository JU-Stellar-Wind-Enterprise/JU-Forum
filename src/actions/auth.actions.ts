"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";
import * as auth from "@/services/auth.service";
import type { PublicRole } from "@/types/auth";

function roleFromForm(value: string): PublicRole {
  return value === "FACULTY" || value === "STAFF" ? value : "STUDENT";
}

/** Handles signup form submissions and redirects to OTP verification. */
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

/** Verifies a submitted signup OTP and redirects authenticated users home. */
export async function verifyOtpAction(_: unknown, form: FormData) {
  const result = await auth.verifyOtp(
    String(form.get("email") || ""),
    String(form.get("code") || ""),
  );
  if (result.success) redirect("/");
  return result;
}

/** Requests a replacement OTP for a pending signup. */
export async function resendOtpAction(_: unknown, form: FormData) {
  try {
    return await auth.resendOtp(String(form.get("email") || ""));
  } catch {
    return { message: "Could not resend OTP." };
  }
}

/** Handles login form submissions and redirects successful users home. */
export async function loginAction(_: unknown, form: FormData) {
  const result = await auth.login(
    String(form.get("email") || ""),
    String(form.get("password") || ""),
  );
  if (result.success) redirect("/");
  return result;
}

/** Deletes the current session cookie and redirects to login. */
export async function logoutAction() {
  await destroySession();
  redirect("/login");