import {
  ENQUIRY_STATUS_META,
  type EnquiryStatus,
} from "@/lib/enquiries";

export default function EnquiryStatusBadge({
  status,
  className = "",
}: {
  status: EnquiryStatus;
  className?: string;
}) {
  const meta = ENQUIRY_STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
