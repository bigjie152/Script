"use client";

import { useMemo } from "react";
import { Sidebar } from "../../../components/layout/Sidebar";
import { useAuth } from "../../../hooks/useAuth";

const NAV_ITEMS = [
  { key: "profile", label: "个人资料" },
  { key: "security", label: "账号安全" },
  { key: "preferences", label: "偏好设置" }
];

export default function UserProfilePage() {
  const { user } = useAuth();
  const username = user?.username || "访客";

  const stats = useMemo(
    () => [
      { label: "已创建项目", value: "--" },
      { label: "累计创作时长", value: "--" },
      { label: "收到评价", value: "--" }
    ],
    []
  );

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="profile" />
        <main className="space-y-6">
          <div className="text-2xl font-semibold">个人中心</div>
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="glass-panel-strong flex flex-col gap-2 px-3 py-4">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="rounded-xl px-4 py-2 text-left text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
                >
                  {item.label}
                </button>
              ))}
            </aside>

            <section className="space-y-6">
              <div className="glass-panel-strong flex flex-col gap-4 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{username}</div>
                    <div className="text-xs text-muted">实名状态：未认证</div>
                  </div>
                </div>
                <div className="text-sm text-muted">
                  你的创作身份、偏好设置与安全信息将在这里统一管理。
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="glass-panel-strong px-5 py-4">
                    <div className="text-xs text-muted">{item.label}</div>
                    <div className="mt-2 text-lg font-semibold text-ink">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="glass-panel-strong px-6 py-5">
                <div className="text-sm font-semibold">安全与访问</div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm font-medium">登录密码</div>
                    <div className="text-xs text-muted">上次修改：--</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm font-medium">实名认证</div>
                    <div className="text-xs text-muted">未认证</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
