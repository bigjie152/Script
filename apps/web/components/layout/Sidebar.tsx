"use client";

import { useRouter } from "next/navigation";
import { Button } from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";

type SidebarItem = {
  key: string;
  label: string;
  href?: string;
};

const ITEMS: SidebarItem[] = [
  { key: "workspace", label: "工作台", href: "/workspace" },
  { key: "projects", label: "我的项目", href: "/workspace" },
  { key: "community", label: "社区中心", href: "/community" },
  { key: "settings", label: "系统设置", href: "/settings" },
  { key: "profile", label: "个人中心", href: "/user/profile" }
];

type SidebarProps = {
  activeKey?: string;
};

export function Sidebar({ activeKey = "workspace" }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const initials = user?.username?.slice(0, 1)?.toUpperCase() || "访";

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
        <div className="px-3 text-xs font-semibold text-muted">工作中心</div>
        {ITEMS.map((item) => (
          <button
            key={item.key}
            className={cn(
              "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
              item.key === activeKey
                ? "bg-white text-ink shadow-soft shadow-indigo-100/40"
                : "text-muted hover:bg-white/50 hover:text-ink"
            )}
            type="button"
            onClick={() => {
              if (item.href) router.push(item.href);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <div className="glass-panel-strong flex items-center gap-3 rounded-2xl px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">
              {user?.username || "访客"}
            </div>
            <div className="text-xs text-muted">个人中心</div>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-muted hover:text-ink"
            onClick={() => router.push("/user/profile")}
            aria-label="个人中心"
          >
            设置
          </button>
        </div>
        {user ? (
          <Button variant="ghost" onClick={logout}>
            退出登录
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => router.push("/login")}>
            登录/注册
          </Button>
        )}
        <div className="text-xs text-muted">版本：V0.1（前端演示）</div>
      </div>
    </aside>
  );
}
