"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { updatePassword } from "@/app/reset-password/actions";
import type { AccountActionState } from "@/lib/account";

const initialState: AccountActionState = {};

export default function ResetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-muted">
        Setting a new password for{" "}
        <span className="font-medium text-ink">{email}</span>.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">New password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Confirm new password
        </span>
        <input
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repeat the new password"
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <KeyRound size={16} />
        )}
        {pending ? "Updating password" : "Update password"}
      </button>
    </form>
  );
}
