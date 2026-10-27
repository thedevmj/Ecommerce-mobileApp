"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-7 shadow-sm">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle size={21} />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          The dashboard could not load
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Check the Supabase environment variables and confirm the latest
          migrations are applied.
        </p>
        <p className="mt-3 break-words rounded-xl bg-canvas px-3 py-2 text-xs leading-5 text-muted">
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
