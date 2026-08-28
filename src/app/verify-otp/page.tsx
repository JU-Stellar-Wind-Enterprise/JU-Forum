import { resendOtpAction, verifyOtpAction } from "@/actions/auth.actions";
import { OtpForm, ResendOtpForm } from "@/components/auth/AuthForm";
export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = (await searchParams).email || "";
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm font-semibold text-sky-600">JU Forum</p>
      <h1 className="text-3xl font-bold text-slate-900">Verify your email</h1>
      <p className="text-slate-600">Enter the OTP sent to {email}.</p>
      <OtpForm action={verifyOtpAction} email={email} />
      <ResendOtpForm action={resendOtpAction} email={email} />
    </main>
  );
}
