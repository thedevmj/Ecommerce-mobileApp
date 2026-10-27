"use client";

import { Eye, EyeOff, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const highlights = [
  {
    icon: ShoppingBag,
    title: "Orders",
    detail: "Process cash-on-delivery orders end to end.",
  },
  {
    icon: Store,
    title: "Catalog",
    detail: "Keep products, categories, and coupons current.",
  },
  {
    icon: Truck,
    title: "Fulfilment",
    detail: "Move orders from pending to delivered.",
  },
];

export default function LoginForm({
  notice,
  initialError,
}: {
  notice?: string | null;
  initialError?: string | null;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        code?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        const detail = result?.message
          ? `${result.message}${result.code ? ` (${result.code})` : ""}`
          : "Unable to sign in.";

        setError(`Supabase rejected the login for ${email}: ${detail}`);
        return;
      }

      window.location.assign(window.location.origin + "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0b1220] px-12 py-14 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Store size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Shopcart</p>
            <p className="text-xs text-white/60">Store operations</p>
          </div>
        </div>

        <div className="relative mt-16 max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <ShieldCheck size={14} />
            Administrators only
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Run the store from one calm, focused console.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Manage the catalog, move cash-on-delivery orders through
            fulfilment, and keep an eye on customers without leaving the
            dashboard.
          </p>

          <div className="mt-10 grid gap-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/55">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative mt-auto text-xs text-white/35">
          Shopcart admin · Cash on delivery
        </p>
      </section>

      <section className="flex items-center justify-center bg-canvas px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
              <Store size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Shopcart</p>
              <p className="text-xs text-muted">Admin console</p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-panel p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Admin sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use the account that has the admin role in Supabase.
            </p>

            {notice ? (
              <p
                role="status"
                className="mt-4 rounded-xl border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success"
              >
                {notice}
              </p>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@shopcart.com"
                  className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Password
                </span>
                <span className="relative block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <div className="-mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand transition hover:text-brand-strong"
                >
                  Forgot password?
                </Link>
              </div>

              {error ? (
                <p className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Signing in" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-muted">
              Access is limited to store administrators. Ask the project owner
              to grant your account the admin role.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
