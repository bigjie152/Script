"use client";

import { Sidebar } from "../../../components/layout/Sidebar";
import { useAuth } from "../../../hooks/useAuth";

export default function UserProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="profile" />
        <main className="space-y-6">
          <div>
            <div className="text-2xl font-semibold">个人中心</div>
            <div className="mt-1 text-sm text-muted">
              你的创作概览与偏好设置将集中在这里。
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass-panel-strong px-5 py-4">
              <div className="text-xs text-muted">作者身份</div>
              <div className="mt-2 text-lg font-semibold">
                {user?.username || "访客"}
              </div>
              <div className="mt-1 text-xs text-muted">实名状态：未认证</div>
            </div>
            <div className="glass-panel-strong px-5 py-4">
              <div className="text-xs text-muted">累计字数</div>
              <div className="mt-2 text-lg font-semibold">--</div>
              <div className="mt-1 text-xs text-muted">统计功能即将上线</div>
            </div>
            <div className="glass-panel-strong px-5 py-4">
              <div className="text-xs text-muted">收到评价</div>
              <div className="mt-2 text-lg font-semibold">--</div>
              <div className="mt-1 text-xs text-muted">评价体系准备中</div>
            </div>
          </div>

          <div className="glass-panel-strong px-6 py-5">
            <div className="text-sm font-semibold">偏好设置</div>
            <div className="mt-2 text-sm text-muted">
              将在后续版本提供通知偏好、主题与快捷键配置。
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
