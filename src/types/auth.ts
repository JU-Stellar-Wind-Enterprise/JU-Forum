import type { AccountStatus, UserRole } from "@/generated/prisma/client";

/**
 * Represents serializable state returned to authentication forms.
 *
 * Successful results may include an email for the next verification step,
 * while unsuccessful results may include a general message or field errors.
 */
export type AuthResult = {
  success?: boolean;
  message?: string;
  email?: string;
  errors?: Record<string, string>;
};
/**
 * Describes the Server Action signature accepted by authentication forms.
 *
 * The action receives the previous state and the browser's submitted form data,
 * then returns the next serializable authentication state.
 */
export type AuthAction = (
  state: AuthResult | undefined,
  form: FormData,
) => Promise<AuthResult | undefined>;
/**
 * Restricts public signup to ordinary university-member roles.
 *
 * Privileged roles such as moderator and administrator must not be self-assigned.
 */
export type PublicRole = Extract<UserRole, "STUDENT" | "FACULTY" | "STAFF">;
/**
 * Contains user fields that are safe for session and presentation code.
 *
 * Sensitive database fields such as password hashes and OTP values are excluded.
 */
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
};
