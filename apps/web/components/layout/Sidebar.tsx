import { cn } from "../../utils/cn";

type SidebarItem = {
  key: string;
  label: string;
};

const ITEMS: SidebarItem[] = [
  { key: "workspace", label: "工作台" },
  { key: "projects", label: "我的项目" },
  { key: "community", label: "社区中心" },
  { key: "settings", label: "系统设置" }
];

type SidebarProps = {
  activeKey?: string;
};

export function Sidebar({ activeKey = "workspace" }: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full w-full flex-col px-4 py-6">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/90 text-white">
          文
        </div>
        <div>
          <div className="text-base font-semibold">Script AI</div>
          <div className="text-xs text-muted">Script Studio</div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
              item.key === activeKey
                ? "bg-white text-ink shadow-soft"
                : "text-muted hover:bg-white/50 hover:text-ink"
            )}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 text-xs text-muted">版本：V0.1（前端演示）</div>
    </aside>
  );
}
