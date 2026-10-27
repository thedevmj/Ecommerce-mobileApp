import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const ENQUIRY_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type Enquiry = {
  id: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryInput = {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
};

export type EnquiryErrors = Partial<Record<"subject" | "message", string>>;

export const ENQUIRY_STATUS_META: Record<
  EnquiryStatus,
  { label: string; description: string }
> = {
  open: {
    label: "Open",
    description: "We have received your enquiry.",
  },
  in_progress: {
    label: "In progress",
    description: "Our support team is looking into it.",
  },
  resolved: {
    label: "Resolved",
    description: "Support has replied to your enquiry.",
  },
  closed: {
    label: "Closed",
    description: "This enquiry is no longer active.",
  },
};

export function isEnquiryStatus(value: unknown): value is EnquiryStatus {
  return (
    typeof value === "string" &&
    (ENQUIRY_STATUSES as readonly string[]).includes(value)
  );
}

export function validateEnquiry(input: {
  subject: string;
  message: string;
}): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (subject.length < 3) {
    errors.subject = "Enter a subject of at least 3 characters.";
  } else if (subject.length > 140) {
    errors.subject = "Keep the subject under 140 characters.";
  }

  if (message.length < 10) {
    errors.message = "Tell us a little more (at least 10 characters).";
  } else if (message.length > 4000) {
    errors.message = "Keep your message under 4,000 characters.";
  }

  return errors;
}

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error("Enquiries need Supabase to be configured.");
  }
};

const mapEnquiry = (row: any): Enquiry => ({
  id: row.id,
  subject: row.subject ?? "",
  message: row.message ?? "",
  status: isEnquiryStatus(row.status) ? row.status : "open",
  adminReply: row.admin_reply ?? null,
  repliedAt: row.replied_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function fetchEnquiries(userId: string): Promise<Enquiry[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id, subject, message, status, admin_reply, replied_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapEnquiry);
}

export async function createEnquiry(
  userId: string,
  input: EnquiryInput
): Promise<Enquiry> {
  requireSupabase();
  const subject = input.subject.trim();
  const message = input.message.trim();
  const errors = validateEnquiry({ subject, message });

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      user_id: userId,
      name: input.name.trim() || input.email.split("@")[0] || "Customer",
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      subject,
      message,
    })
    .select(
      "id, subject, message, status, admin_reply, replied_at, created_at, updated_at"
    )
    .single();

  if (error) throw error;
  return mapEnquiry(data);
}
