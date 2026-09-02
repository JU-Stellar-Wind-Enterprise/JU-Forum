import Link from "next/link";
import { signupAction } from "@/actions/auth.actions";
import { SignupForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm font-semibold text-sky-600">JU Forum</p>
      <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
      <SignupForm action={signupAction} />
      <Link href="/login" className="font-medium text-blue-600 underline">
        Already have an account? Log in
      </Link>
    </main>
  );
}
