import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import Unauthorized from "@/components/Unauthorized";
import { getAdminIdentity } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, error, roleColumnMissing } = await getAdminIdentity();

  if (!user) {
    redirect("/login");
  }

  if (!profile || profile.role !== "admin") {
    return (
      <Unauthorized
        email={user.email ?? "Unknown account"}
        userId={user.id}
        roleReady={!roleColumnMissing}
        detail={error ?? undefined}
      />
    );
  }

  const email = user.email ?? "Administrator";

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-panel/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">Shopcart admin</p>
              <p className="text-sm font-semibold">Store operations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent sm:inline-flex">
                COD only
              </span>
              <span className="hidden max-w-56 truncate text-sm text-muted md:inline">
                {email}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="mt-3">
            <MobileNav />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
