import { ArrowLeft, KeyRound, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import PasswordResetRequestForm from "@/components/account/PasswordResetRequestForm";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Reset password | Shopcart Admin",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
            <Store size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Shopcart</p>
            <p className="text-xs text-muted">Admin console</p>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-panel p-6 shadow-sm sm:p-8">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
            <KeyRound size={21} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter the login email for your admin account. We will send a secure
            link to set a new password.
          </p>

          {params.error === "link" ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              That recovery link is invalid or expired. Request a new one below.
            </p>
          ) : null}

          <div className="mt-5">
            <PasswordResetRequestForm action={requestPasswordReset} />
          </div>

          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition hover:text-brand-strong"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
