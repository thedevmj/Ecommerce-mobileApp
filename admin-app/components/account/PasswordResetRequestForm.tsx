"use client";

import { Loader2, Mail, Send } from "lucide-react";
import { useActionState } from "react";
import type { AccountActionState } from "@/lib/account";

const initialState: AccountActionState = {};

export default function PasswordResetRequestForm({
  action,
  email,
  showEmail = true,
}: {
  action: (
    previous: AccountActionState,
    formData: FormData
  ) => Promise<AccountActionState>;
  email?: string;
  showEmail?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {showEmail ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Login email</span>
          <span className="relative block">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@shopcart.com"
              className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
            />
          </span>
        </label>
      ) : (
        <p className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-muted">
          A reset link will be sent to{" "}
          <span className="font-medium text-ink">{email}</span>.
        </p>
      )}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-xl border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {pending ? "Sending reset link" : "Send reset link"}
      </button>
    </form>
  );
}
