import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-strong">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{hint}</p>
    </div>
  );
}
