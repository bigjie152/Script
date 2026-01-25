type KpiCardProps = {
  title: string;
  value: string | number;
  helper?: string;
  accent?: "indigo" | "amber" | "emerald" | "slate";
};

const accentMap = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600"
};

export function KpiCard({ title, value, helper, accent = "indigo" }: KpiCardProps) {
  return (
    <div className="glass-panel-strong flex flex-col justify-between px-5 py-4">
      <div className="text-xs text-muted">{title}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-2xl font-semibold text-ink">{value}</div>
        <div className={`rounded-full px-2 py-1 text-[11px] ${accentMap[accent]}`}>
          {helper || "--"}
        </div>
      </div>
    </div>
  );
}
