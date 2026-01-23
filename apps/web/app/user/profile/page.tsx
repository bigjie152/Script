"use client";

import { useMemo } from "react";
import { Sidebar } from "../../../components/layout/Sidebar";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorBanner } from "../../../components/common/ErrorBanner";
import { ProjectCard } from "../../../components/projects/ProjectCard";
import { useAuth } from "../../../hooks/useAuth";
import { useUserProfile } from "../../../hooks/useUserProfile";
import { useNotifications } from "../../../hooks/useNotifications";

const NAV_ITEMS = [
  { key: "profile", label: "个人资料" },
  { key: "community", label: "社区资产" },
  { key: "preferences", label: "偏好设置" }
];

function getProjectNameFromPayload(payload: Record<string, unknown> | null | undefined) {
  if (!payload) {
    return "";
  }
  const name = payload.projectName;
  return typeof name === "string" ? name : "";
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const username = user?.username || "访客";
  const { data, loading, error } = useUserProfile();
  const notifications = useNotifications();

  const stats = useMemo(
    () => [
      { label: "已发布作品", value: data?.myProjects?.length ?? 0 },
      { label: "收藏作品", value: data?.favorites?.length ?? 0 },
      { label: "被采纳建议", value: data?.acceptedSuggestionsCount ?? 0 }
    ],
    [data?.myProjects?.length, data?.favorites?.length, data?.acceptedSuggestionsCount]
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

              {loading ? (
                <EmptyState title="加载中…" description="正在读取个人数据" />
              ) : error ? (
                <ErrorBanner message={error} />
              ) : data ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">我的发布作品</div>
                      <div className="text-xs text-muted">共 {data.myProjects.length} 项</div>
                    </div>
                    {data.myProjects.length === 0 ? (
                      <EmptyState title="暂无作品" description="发布后会在这里展示" />
                    ) : (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {data.myProjects.map((item) => (
                          <ProjectCard
                            key={item.id}
                            project={{
                              id: item.id,
                              name: item.name,
                              description: item.description,
                              updatedAt: item.updatedAt ?? undefined,
                              truthStatus: item.truthStatus
                            }}
                            variant="list"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">我的收藏</div>
                      <div className="text-xs text-muted">共 {data.favorites.length} 项</div>
                    </div>
                    {data.favorites.length === 0 ? (
                      <EmptyState title="暂无收藏" description="收藏作品后会在这里出现" />
                    ) : (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {data.favorites.map((item) => (
                          <ProjectCard
                            key={item.id}
                            project={{
                              id: item.id,
                              name: item.name,
                              description: item.description,
                              updatedAt: item.updatedAt ?? undefined,
                              truthStatus: item.truthStatus
                            }}
                            variant="list"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel-strong px-6 py-5">
                    <div className="text-sm font-semibold">我的互动</div>
                    <div className="mt-3 space-y-3 text-sm text-muted">
                      {data.interactions.length === 0 ? (
                        <div>暂无互动记录</div>
                      ) : (
                        data.interactions.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                          >
                            <div className="text-xs text-muted">
                              {(item.projectName || "未知项目")} · {item.createdAt}
                            </div>
                            <div className="mt-2 text-sm text-ink">{item.content}</div>
                            {item.status === "accepted" ? (
                              <div className="mt-2 text-xs text-emerald-600">已被采纳</div>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="glass-panel-strong px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">通知中心</div>
                      <button
                        type="button"
                        className="text-xs text-indigo-600"
                        onClick={() => notifications.markRead()}
                      >
                        全部标记已读
                      </button>
                    </div>
                    <div className="mt-3 space-y-3 text-sm text-muted">
                      {notifications.loading ? (
                        <div>加载中…</div>
                      ) : notifications.items.length === 0 ? (
                        <div>暂无通知</div>
                      ) : (
                        notifications.items.map((item) => {
                          const payloadProjectName =
                            item.payload && typeof item.payload === "object"
                              ? getProjectNameFromPayload(
                                  item.payload as Record<string, unknown>
                                )
                              : "";
                          return (
                            <div
                              key={item.id}
                              className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                            >
                              <div className="text-xs text-muted">{item.createdAt}</div>
                              <div className="mt-1 text-sm text-ink">
                                {item.type === "suggestion_accepted"
                                  ? "你的建议被采纳了"
                                  : "收到新通知"}
                              </div>
                              {payloadProjectName ? (
                                <div className="mt-1 text-xs text-muted">
                                  {payloadProjectName}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
