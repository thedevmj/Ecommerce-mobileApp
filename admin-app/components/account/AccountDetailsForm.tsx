"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState } from "react";
import { updateAccountDetails } from "@/app/dashboard/account/actions";
import type { AccountActionState } from "@/lib/account";

const initialState: AccountActionState = {};

export default function AccountDetailsForm({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateAccountDetails,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Full name</span>
        <input
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={fullName}
          placeholder="Store administrator"
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Login email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={email}
          placeholder="admin@shopcart.com"
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
        <span className="mt-1.5 block text-xs leading-5 text-muted">
          Used for sign-in and password reset emails. Changing it requires
          confirmation from the new address.
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Contact phone
        </span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone}
          placeholder="+1 555 010 2030"
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
        />
        <span className="mt-1.5 block text-xs leading-5 text-muted">
          Saved with your admin profile for account contact. Password recovery
          uses your login email.
        </span>
      </label>

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
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {pending ? "Saving details" : "Save details"}
      </button>
    </form>
  );
}
