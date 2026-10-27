import { ShieldAlert } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

type UnauthorizedProps = {
  email: string;
  userId: string;
  roleReady: boolean;
  detail?: string;
};

export default function Unauthorized({
  email,
  userId,
  roleReady,
  detail,
}: UnauthorizedProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-line bg-panel p-7 shadow-sm sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning-soft text-warning">
          <ShieldAlert size={24} />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Admin access required
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          You are signed in as <span className="font-medium text-ink">{email}</span>
          , but this account does not have the admin role.
        </p>

        {roleReady ? (
          <div className="mt-5 rounded-2xl border border-line bg-canvas p-4">
            <p className="text-sm font-medium">Grant this account admin access</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Run this once in the Supabase SQL editor, then refresh this page.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0b1220] p-3 text-xs text-white/80">
{`update public.profiles
set role = 'admin'
where id = '${userId}';`}
            </pre>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-warning/20 bg-warning-soft p-4">
            <p className="text-sm font-medium text-ink">
              The admin roles migration has not been applied
            </p>
            <p className="mt-1 text-xs leading-5 text-warning">
              Apply `supabase/migrations/0004_admin_roles.sql`, then sign in
              again.
            </p>
            {detail ? (
              <p className="mt-2 break-words text-[11px] leading-5 text-warning/80">
                {detail}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SignOutButton />
          <span className="text-xs text-muted">Signed in to Shopcart admin</span>
        </div>
      </div>
    </main>
  );
}
