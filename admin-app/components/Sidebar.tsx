"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/account", label: "Account", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={
        compact
          ? `inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-brand-soft text-brand-strong"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`
          : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-soft text-brand-strong"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`
      }
    >
      <Icon size={18} />
      {item.label}
    </Link>
  );
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const initial = email.charAt(0).toUpperCase() || "A";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-panel px-4 py-6 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white shadow-sm">
          <Store size={20} />
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-tight">
            Shopcart
          </span>
          <span className="block text-xs text-muted">Admin console</span>
        </span>
      </Link>

      <nav className="mt-8 flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="rounded-2xl border border-line bg-canvas p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{email}</span>
            <span className="block text-xs text-muted">Administrator</span>
          </span>
        </div>
        <p className="mt-3 rounded-lg bg-panel px-2.5 py-2 text-[11px] leading-4 text-muted">
          Cash on delivery only. No online payments.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          compact
        />
      ))}
    </nav>
  );
}
