import type { AccountStatus, UserRole } from "@/generated/prisma/client";

/** Serializable state returned to authentication forms. */
export type AuthResult = {
  success?: boolean;
  message?: string;
  email?: string;
  errors?: Record<string, string>;
};
/** Server Action signature accepted by reusable authentication forms. */
export type AuthAction = (
  state: AuthResult | undefined,
  form: FormData,
) => Promise<AuthResult | undefined>;
/** Roles that users may select during public signup. */
export type PublicRole = Extract<UserRole, "STUDENT" | "FACULTY" | "STAFF">;
/** Safe user fields allowed in session and presentation code. */
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
};
