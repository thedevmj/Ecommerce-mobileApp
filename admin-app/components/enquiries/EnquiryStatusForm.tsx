"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import {
  updateEnquiry,
  type EnquiryActionState,
} from "@/app/dashboard/enquiries/actions";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  type EnquiryStatus,
} from "@/lib/enquiries";

const initialState: EnquiryActionState = {};

export default function EnquiryStatusForm({
  enquiryId,
  status,
  reply,
}: {
  enquiryId: string;
  status: EnquiryStatus;
  reply: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateEnquiry,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="enquiry_id" value={enquiryId} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Status</span>
        <select
          name="status"
          defaultValue={status}
          disabled={pending}
          className="h-11 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
        >
          {ENQUIRY_STATUSES.map((option) => (
            <option key={option} value={option}>
              {ENQUIRY_STATUS_META[option].label} —{" "}
              {ENQUIRY_STATUS_META[option].description}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Reply to customer
        </span>
        <textarea
          name="admin_reply"
          defaultValue={reply ?? ""}
          rows={6}
          maxLength={4000}
          disabled={pending}
          placeholder="Write a reply that will appear in the customer's enquiry history."
          className="w-full resize-y rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
        />
      </label>

      <p className="text-xs leading-5 text-muted">
        Saving with an empty reply clears the customer-visible reply. Replies are
        limited to 4,000 characters.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p className="rounded-xl border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success">
          Enquiry saved. The mobile app shows the update on its next refresh.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving enquiry" : "Save status & reply"}
        {!pending ? <Send size={15} /> : null}
      </button>
    </form>
  );
}
