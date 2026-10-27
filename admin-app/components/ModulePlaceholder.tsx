import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ModulePlaceholderProps = {
  icon: LucideIcon;
  phase: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function ModulePlaceholder({
  icon: Icon,
  phase,
  title,
  description,
  children,
}: ModulePlaceholderProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
      <div className="flex flex-col gap-4 border-b border-line bg-linear-to-br from-brand-soft/70 via-panel to-panel p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-sm">
          <Icon size={23} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {phase}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        {children ?? (
          <p className="rounded-2xl border border-dashed border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
            This module is queued for the next implementation pass.
          </p>
        )}
      </div>
    </div>
  );
}
