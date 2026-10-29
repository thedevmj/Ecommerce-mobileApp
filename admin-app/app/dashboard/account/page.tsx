import {
  CalendarDays,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountDetailsForm from "@/components/account/AccountDetailsForm";
import PasswordResetRequestForm from "@/components/account/PasswordResetRequestForm";
import PageHeader from "@/components/PageHeader";
import { getAdminSession } from "@/lib/admin";
import { sendAccountPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Account | Shopcart Admin",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

export default async function AccountPage() {
  const session = await getAdminSession();

  if ("error" in session) {
    redirect("/login");
  }

  const { user, profile } = session;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Account"
        description="Manage the admin login details used for access, contact, and password recovery."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <UserRound size={19} />
            </span>
            <div>
              <h2 className="font-semibold">Account details</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Keep your name and contact number current. Your login email is
                also used for password reset messages.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <AccountDetailsForm
              fullName={profile?.full_name ?? ""}
              email={user.email ?? ""}
              phone={profile?.phone ?? ""}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand" />
              <h2 className="font-semibold">Profile snapshot</h2>
            </div>

            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Login email
                  </dt>
                  <dd className="mt-0.5 break-all font-medium">
                    {user.email ?? "Not set"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Contact phone
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.phone || "Not set"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Account created
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <KeyRound size={16} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Last sign in
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(user.last_sign_in_at)}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-brand" />
              <h2 className="font-semibold">Reset password</h2>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">
              Send a secure recovery link to your login email. The link opens a
              page where you can set a new password.
            </p>

            <div className="mt-4">
              <PasswordResetRequestForm
                action={sendAccountPasswordReset}
                email={user.email ?? "your login email"}
                showEmail={false}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
