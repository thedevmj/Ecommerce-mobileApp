import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnquiryStatusBadge from "@/components/enquiries/EnquiryStatusBadge";
import EnquiryStatusForm from "@/components/enquiries/EnquiryStatusForm";
import PageHeader from "@/components/PageHeader";
import {
  ENQUIRY_STATUS_META,
  enquiryAuthor,
  enquiryInitial,
  formatEnquiryDateTime,
  isEnquiryStatus,
  type Enquiry,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Enquiry · Shopcart Admin",
};

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/enquiries"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to enquiries
        </Link>
        <div className="rounded-3xl border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-semibold text-danger">
                Could not load this enquiry
              </p>
              <p className="mt-1 text-sm leading-6 text-danger/80">
                {error.message}
              </p>
              <p className="mt-2 text-xs leading-5 text-danger/70">
                Apply migration `0008_enquiries.sql` and confirm this account has
                the admin role.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const enquiry = data as Enquiry;
  const status: EnquiryStatus = isEnquiryStatus(enquiry.status)
    ? enquiry.status
    : "open";
  const author = enquiryAuthor(enquiry);
  const meta = ENQUIRY_STATUS_META[status];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/enquiries"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to enquiries
      </Link>

      <PageHeader
        eyebrow="Customer enquiry"
        title={enquiry.subject}
        description={`Sent ${formatEnquiryDateTime(enquiry.created_at)} · ${meta.description}`}
        action={<EnquiryStatusBadge status={status} />}
      />

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr] xl:items-start">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                  {enquiryInitial(enquiry)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{author}</p>
                  <Link
                    href={`/dashboard/customers/${enquiry.user_id}`}
                    className="text-xs font-medium text-brand transition hover:text-brand-strong"
                  >
                    View customer profile
                  </Link>
                </div>
              </div>
              <EnquiryStatusBadge status={status} className="sm:hidden" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {enquiry.email ? (
                <a
                  href={`mailto:${enquiry.email}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm ring-1 ring-line transition hover:bg-panel"
                >
                  <Mail size={14} className="text-muted" />
                  {enquiry.email}
                </a>
              ) : null}
              {enquiry.phone ? (
                <a
                  href={`tel:${enquiry.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm ring-1 ring-line transition hover:bg-panel"
                >
                  <Phone size={14} className="text-muted" />
                  {enquiry.phone}
                </a>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <MessageSquare size={17} className="text-brand-strong" />
                <h2 className="font-semibold">Message</h2>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7">
                {enquiry.message}
              </p>
            </div>
          </section>

          {enquiry.admin_reply ? (
            <section className="rounded-3xl border border-brand/20 bg-brand-soft p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2.5">
                <MessageSquare size={17} className="text-brand-strong" />
                <h2 className="font-semibold">Current support reply</h2>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/85">
                {enquiry.admin_reply}
              </p>
              {enquiry.replied_at ? (
                <p className="mt-3 text-xs text-muted">
                  Replied {formatEnquiryDateTime(enquiry.replied_at)}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={17} className="text-brand-strong" />
              <h2 className="font-semibold">Status & reply</h2>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Customers see the status and your reply in the mobile app.
            </p>
            <div className="mt-4">
              <EnquiryStatusForm
                enquiryId={enquiry.id}
                status={status}
                reply={enquiry.admin_reply}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2.5">
              <CalendarClock size={17} className="text-brand-strong" />
              <h2 className="font-semibold">Timeline</h2>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Received</dt>
                <dd>{formatEnquiryDateTime(enquiry.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Last updated</dt>
                <dd>{formatEnquiryDateTime(enquiry.updated_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Last reply</dt>
                <dd>
                  {enquiry.replied_at
                    ? formatEnquiryDateTime(enquiry.replied_at)
                    : "Not replied yet"}
                </dd>
              </div>
            </dl>
          </section>

          <p className="flex items-center gap-2 px-1 text-xs leading-5 text-muted">
            <UserRound size={13} />
            Account ID {enquiry.user_id}
          </p>
        </div>
      </div>
    </div>
  );
}
