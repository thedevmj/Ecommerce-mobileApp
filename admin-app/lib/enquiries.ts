export const ENQUIRY_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type Enquiry = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: EnquiryStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ENQUIRIES_PAGE_SIZE = 12;

type EnquiryStatusMeta = {
  label: string;
  description: string;
  badge: string;
  dot: string;
};

export const ENQUIRY_STATUS_META: Record<EnquiryStatus, EnquiryStatusMeta> = {
  open: {
    label: "Open",
    description: "Waiting for a reply",
    badge: "bg-warning-soft text-warning ring-1 ring-warning/15",
    dot: "bg-warning",
  },
  in_progress: {
    label: "In progress",
    description: "Being investigated",
    badge: "bg-brand-soft text-brand-strong ring-1 ring-brand/15",
    dot: "bg-brand",
  },
  resolved: {
    label: "Resolved",
    description: "Replied and completed",
    badge: "bg-success-soft text-success ring-1 ring-success/15",
    dot: "bg-success",
  },
  closed: {
    label: "Closed",
    description: "No longer active",
    badge: "bg-canvas text-muted ring-1 ring-line",
    dot: "bg-muted",
  },
};

export const ENQUIRY_STATUS_FILTERS = [
  { value: null, label: "All" },
  ...ENQUIRY_STATUSES.map((value) => ({
    value,
    label: ENQUIRY_STATUS_META[value].label,
  })),
] as const;

export function isEnquiryStatus(value: unknown): value is EnquiryStatus {
  return (
    typeof value === "string" &&
    (ENQUIRY_STATUSES as readonly string[]).includes(value)
  );
}

export function enquiryAuthor(enquiry: Pick<Enquiry, "name" | "email">) {
  const name = enquiry.name?.trim();
  if (name) return name;

  const email = enquiry.email?.trim();
  if (email) return email.split("@")[0] || email;

  return "Customer";
}

export function enquiryInitial(
  enquiry: Pick<Enquiry, "name" | "email">
) {
  return enquiryAuthor(enquiry).trim().charAt(0).toUpperCase() || "C";
}

export function formatEnquiryDateTime(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function validateEnquiryReply(reply: string): string | null {
  if (reply.trim().length > 4000) {
    return "Keep the reply under 4,000 characters.";
  }

  return null;
}
