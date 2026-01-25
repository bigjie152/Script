import { cn } from "../../utils/cn";

type TabOption = {
  key: string;
  label: string;
  badge?: string;
};

type TabGroupProps = {
  value: string;
  onChange: (value: string) => void;
  tabs: TabOption[];
};

export function TabGroup({ value, onChange, tabs }: TabGroupProps) {
  return (
    <div className="glass-panel-strong flex gap-2 p-1">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            className={cn(
              "relative flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-white text-ink shadow-soft"
                : "text-muted hover:text-ink"
            )}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.badge ? (
              <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
