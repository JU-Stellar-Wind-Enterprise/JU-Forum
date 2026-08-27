import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import { LoginForm } from "@/components/auth/AuthForm";
export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Log in</h1>
      <LoginForm action={loginAction} />
      <Link href="/signup" className="underline">
        Need an account? Sign up
      </Link>
    </main>
  );
}