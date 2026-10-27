import { ArrowLeft, ShieldCheck, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set a new password | Shopcart Admin",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=link");
  }

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
            <ShieldCheck size={21} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Choose a new password for your admin account. You will be signed out
            after the change so you can sign in again.
          </p>

          <div className="mt-5">
            <ResetPasswordForm email={user.email ?? "your account"} />
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
