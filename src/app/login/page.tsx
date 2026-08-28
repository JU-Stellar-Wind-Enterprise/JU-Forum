import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import { LoginForm } from "@/components/auth/AuthForm";
export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm font-semibold text-sky-600">JU Forum</p>
      <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
      <LoginForm action={loginAction} />
      <Link href="/signup" className="font-medium text-blue-600 underline">
        Need an account? Sign up
      </Link>
    </main>
  );
}
