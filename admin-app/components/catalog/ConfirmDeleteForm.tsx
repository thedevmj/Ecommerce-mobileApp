"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState } from "react";

type DeleteState = { ok?: boolean; error?: string };

type ConfirmDeleteFormProps = {
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  idName: string;
  id: string;
  message: string;
  label: string;
  successMessage?: string;
};

export default function ConfirmDeleteForm({
  action,
  idName,
  id,
  message,
  label,
  successMessage = "Deleted.",
}: ConfirmDeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name={idName} value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3.5 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        {pending ? "Deleting" : label}
      </button>
      {state.error ? (
        <p className="text-xs leading-5 text-danger">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs leading-5 text-success">{successMessage}</p>
      ) : null}
    </form>
  );
}
