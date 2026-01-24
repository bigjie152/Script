"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/layout/Sidebar";
import { TopNav } from "../../../components/layout/TopNav";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorBanner } from "../../../components/common/ErrorBanner";
import { ProjectCard } from "../../../components/projects/ProjectCard";
import { useAuth } from "../../../hooks/useAuth";
import { useUserProfile } from "../../../hooks/useUserProfile";
import { useNotifications } from "../../../hooks/useNotifications";
import { createProject } from "../../../services/projectApi";

type ProfileTab = "dashboard" | "works" | "community";

function getProjectNameFromPayload(payload: Record<string, unknown> | null | undefined) {
  if (!payload) {
    return "";
  }
  const name = payload.projectName;
  return typeof name === "string" ? name : "";
}

export default function UserProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const username = user?.username || "访客";
  const { data, loading, error } = useUserProfile();
  const notifications = useNotifications();
  const [activeTab, setActiveTab] = useState<ProfileTab>("dashboard");
  const [creating, setCreating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!user) {
      setCreateError("请先登录后再创建项目");
      router.push("/login");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const result = await createProject({
        name: "未命名剧本",
        description: "新建项目"
      });
      const projectId = result.projectId || result.project?.id;
      if (!projectId) {
        throw new Error("创建失败，请重试");
      }
      router.push(`/projects/${projectId}/editor/overview`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(
    () => [
      { label: "已发布作品", value: data?.myProjects?.length ?? 0, hint: "作品数量" },
      { label: "收藏作品", value: data?.favorites?.length ?? 0, hint: "收藏库" },
      {
        label: "被采纳建议",
        value: data?.acceptedSuggestionsCount ?? 0,
        hint: "社区贡献"
      }
    ],
    [data?.myProjects?.length, data?.favorites?.length, data?.acceptedSuggestionsCount]
  );

  const emailLabel = user ? `${user.username}@script.ai` : "未绑定邮箱";
  const identityLabel = user?.id ? `账号 ID: ${user.id.slice(0, 10)}` : "账号 ID: 未登录";

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="profile" />
        <main className="space-y-6">
          <TopNav
            onCreate={handleCreate}
            creating={creating}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            title="个人中心"
            subtitle="管理你的创作身份、作品与社区互动。"
          />

          {createError ? <ErrorBanner message={createError} /> : null}

          <div className="glass-panel-strong px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
                  {username.slice(0, 1).toUpperCase()}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-lg font-semibold">{username}</div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600">
                      实名状态未认证
                    </span>
                  </div>
                  <div className="text-sm text-muted">
                    资深剧本创作者，欢迎回到 Script AI 创作主站。
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-muted">
                      {emailLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-muted">
                      {identityLabel}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" onClick={() => router.push("/settings")}
              >
                账号设置
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-b border-slate-100 pb-3 text-sm">
            {[
              { key: "dashboard", label: "创作概览" },
              { key: "works", label: "我的作品与收藏" },
              { key: "community", label: "社区互动" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as ProfileTab)}
                className={`pb-2 font-medium ${
                  activeTab === tab.key
                    ? "text-indigo-600 border-b-2 border-indigo-500"
                    : "text-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <EmptyState title="加载中…" description="正在读取个人数据" />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : data ? (
            <>
              {activeTab === "dashboard" ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    创作看板（Creative Dashboard）
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {stats.map((item) => (
                      <div key={item.label} className="glass-panel-strong px-5 py-4">
                        <div className="text-xs text-muted">{item.label}</div>
                        <div className="mt-2 text-xl font-semibold text-ink">
                          {item.value}
                        </div>
                        <div className="mt-1 text-xs text-muted">{item.hint}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="glass-panel-strong px-6 py-5">
                      <div className="text-sm font-semibold">账户安全</div>
                      <div className="mt-4 space-y-4 text-sm text-muted">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-ink">登录密码</div>
                            <div className="text-xs text-muted">上次修改：3 个月前</div>
                          </div>
                          <button className="text-xs text-indigo-600" type="button">
                            修改
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-ink">实名认证（KYC）</div>
                            <div className="text-xs text-muted">
                              未完成认证 · 可提升发布可信度
                            </div>
                          </div>
                          <span className="text-xs text-muted">未认证</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel-strong px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">API Access</div>
                        <button className="text-xs text-indigo-600" type="button">
                          + 新建 Token
                        </button>
                      </div>
                      <div className="mt-4 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm">
                        <div className="text-ink">External_Analysis_Tool</div>
                        <div className="mt-1 text-xs text-muted">只读 · 最近使用：暂无</div>
                      </div>
                      <div className="mt-3 text-xs text-muted">
                        API Token 可用于把创作数据导出到第三方分析工具。
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "works" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="glass-panel-strong px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">我发布的作品</div>
                      <div className="text-xs text-muted">共 {data.myProjects.length} 项</div>
                    </div>
                    {data.myProjects.length === 0 ? (
                      <EmptyState title="暂无作品" description="发布后会在这里展示" />
                    ) : (
                      <div className="mt-4 space-y-3">
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

                  <div className="glass-panel-strong px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">我的收藏</div>
                      <div className="text-xs text-muted">共 {data.favorites.length} 项</div>
                    </div>
                    {data.favorites.length === 0 ? (
                      <EmptyState title="暂无收藏" description="收藏作品后会在这里出现" />
                    ) : (
                      <div className="mt-4 space-y-3">
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
                </div>
              ) : null}

              {activeTab === "community" ? (
                <div className="space-y-6">
                  <div className="glass-panel-strong flex items-center justify-between px-6 py-5">
                    <div>
                      <div className="text-sm font-semibold">社区贡献度</div>
                      <div className="mt-1 text-xs text-muted">
                        你的建议帮助了更多创作者完善剧本。
                      </div>
                    </div>
                    <div className="text-2xl font-semibold text-amber-600">
                      {data.acceptedSuggestionsCount}
                    </div>
                  </div>

                  <div className="glass-panel-strong px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">消息通知</div>
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
                </div>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
