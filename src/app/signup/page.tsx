import Link from "next/link";
import { signupAction } from "@/actions/auth.actions";
import { SignupForm } from "@/components/auth/AuthForm";
export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <SignupForm action={signupAction} />
      <Link href="/login" className="underline">
        Already have an account? Log in
      </Link>
    </main>
  );
}