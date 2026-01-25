"use client";

import { useEffect, useRef, useState } from "react";
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
  { key: "projects", label: "我的项目", href: "/projects" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside className="glass-panel flex h-full w-full flex-col px-4 py-6">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/90 text-white">
          SF
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

      <div className="mt-auto space-y-3 pt-6" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="glass-panel-strong flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              {initials}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">
                {user?.username || "访客"}
              </div>
              <div className="text-xs text-muted">个人中心</div>
            </div>
            <span className="rounded-full border border-slate-200 px-2 py-1 text-xs text-muted">
              设置
            </span>
          </button>
          {menuOpen ? (
            <div className="absolute bottom-14 left-0 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/user/profile");
                }}
              >
                个人中心
              </button>
              {user ? (
                <button
                  className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                  }}
                >
                  退出登录
                </button>
              ) : (
                <button
                  className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/login");
                  }}
                >
                  登录/注册
                </button>
              )}
            </div>
          ) : null}
        </div>
        {!user ? (
          <Button variant="ghost" onClick={() => router.push("/login")}>
            登录/注册
          </Button>
        ) : null}
        <div className="text-xs text-muted">版本：V0.1（前端演示）</div>
      </div>
    </aside>
  );
}
