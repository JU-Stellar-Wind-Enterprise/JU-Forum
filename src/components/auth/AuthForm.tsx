"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import type { AuthAction, AuthResult } from "@/types/auth";

/**
 * Renders the shared authentication form layout and submission state.
 *
 * @param props - The Server Action, form fields, and submit-button label.
 * @returns A client-rendered authentication form with feedback and pending state.
 */
export function AuthForm({
  action,
  children,
  button,
}: {
  action: AuthAction;
  children: ReactNode;
  button: string;
}) {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(action, undefined);
  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-sky-100 bg-white p-6 shadow-sm"
    >
      {children}
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state?.email && (
        <Link
          href={`/verify-otp?email=${encodeURIComponent(state.email)}`}
          className="text-sm underline"
        >
          Continue to email verification and resend OTP
        </Link>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Please wait…" : button}
      </button>
    </form>
  );
}

const Field = ({
  name,
  type = "text",
  placeholder,
}: {
  name: string;
  type?: string;
  placeholder: string;
}) => (
  <input
    required
    name={name}
    type={type}
    placeholder={placeholder}
    className="rounded-md border border-slate-200 bg-white px-3 py-2.5"
  />
);
/**
 * Renders the public JU account signup form.
 *
 * @param props - The signup Server Action used when the form is submitted.
 * @returns A form for collecting identity, role, email, and password details.
 */
export function SignupForm({ action }: { action: AuthAction }) {
  return (
    <AuthForm action={action} button="Create account">
      <Field name="name" placeholder="Full name" />
      <Field name="email" type="email" placeholder="JU email (@juniv.edu)" />
      <select
        name="role"
        defaultValue="STUDENT"
        className="rounded-md border border-slate-200 bg-white px-3 py-2.5"
      >
        <option value="STUDENT">Student</option>
        <option value="FACULTY">Faculty</option>
        <option value="STAFF">Staff</option>
      </select>
      <Field
        name="password"
        type="password"
        placeholder="Password (6+ characters)"
      />
    </AuthForm>
  );
}
/**
 * Renders the email and password login form.
 *
 * @param props - The login Server Action used when the form is submitted.
 * @returns A form for collecting an existing user's credentials.
 */
export function LoginForm({ action }: { action: AuthAction }) {
  return (
    <AuthForm action={action} button="Log in">
      <Field name="email" type="email" placeholder="Email" />
      <Field name="password" type="password" placeholder="Password" />
    </AuthForm>
  );
}
/**
 * Renders the six-digit signup OTP verification form.
 *
 * @param props - The verification action and pending account email.
 * @returns A form that submits the email and entered OTP for verification.
 */
export function OtpForm({
  action,
  email,
}: {
  action: AuthAction;
  email: string;
}) {
  return (
    <AuthForm action={action} button="Verify OTP">
      <input type="hidden" name="email" value={email} />
      <Field name="code" placeholder="Six-digit OTP" />
    </AuthForm>
  );
}

/**
 * Renders the inline action used to resend an expired or missing OTP.
 *
 * @param props - The resend action and email belonging to the pending account.
 * @returns An inline resend control with pending, success, and error feedback.
 */
export function ResendOtpForm({
  action,
  email,
}: {
  action: AuthAction;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<
    AuthResult | undefined,
    FormData
  >(action, undefined);
  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-blue-600 underline disabled:opacity-50"
      >
        {pending ? "Sending…" : "Resend OTP"}
      </button>
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">A new OTP was sent.</p>
      )}
    </form>
  );
}