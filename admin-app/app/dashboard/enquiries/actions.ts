"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";
import { isEnquiryStatus, validateEnquiryReply } from "@/lib/enquiries";

export type EnquiryActionState = {
  ok?: boolean;
  error?: string;
};

export async function updateEnquiry(
  _previous: EnquiryActionState,
  formData: FormData
): Promise<EnquiryActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const id = String(formData.get("enquiry_id") ?? "").trim().slice(0, 64);
  const status = String(formData.get("status") ?? "");
  const reply = String(formData.get("admin_reply") ?? "").trim();

  if (!id) {
    return { error: "The enquiry could not be identified." };
  }

  if (!isEnquiryStatus(status)) {
    return { error: "Choose a valid enquiry status." };
  }

  const replyError = validateEnquiryReply(reply);
  if (replyError) return { error: replyError };

  const { data: existing, error: loadError } = await session.supabase
    .from("enquiries")
    .select("id, admin_reply, replied_at")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { error: loadError.message };

  if (!existing) {
    return {
      error:
        "This enquiry is no longer available. Apply migration 0008_enquiries.sql if enquiries are missing.",
    };
  }

  const replyChanged = (existing.admin_reply ?? "") !== reply;
  const repliedAt = reply
    ? replyChanged
      ? new Date().toISOString()
      : existing.replied_at ?? new Date().toISOString()
    : null;

  const { data: updated, error } = await session.supabase
    .from("enquiries")
    .update({
      status,
      admin_reply: reply || null,
      replied_at: repliedAt,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  if (!updated) {
    return {
      error:
        "This enquiry changed while you were updating it. Refresh and try again.",
    };
  }

  revalidatePath("/dashboard/enquiries");
  revalidatePath(`/dashboard/enquiries/${id}`);
  revalidatePath("/dashboard");

  return { ok: true };
}
