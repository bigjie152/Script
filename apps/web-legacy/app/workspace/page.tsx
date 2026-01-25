"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { useAuth } from "../../hooks/useAuth";
import { useProjects } from "../../hooks/useProjects";
import { createProject } from "../../services/projectApi";

export default function WorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { projects, loading, error: listError } = useProjects({
    sort: "updatedAt",
    q: searchQuery
  });

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const lastActive = recentProjects[0];

  const statusSummary = useMemo(() => {
    const summary = { draft: 0, inProgress: 0, locked: 0 };
    projects.forEach((item) => {
      if (item.status === "In Progress") summary.inProgress += 1;
      else summary.draft += 1;
      if (item.truthStatus === "Locked") summary.locked += 1;
    });
    return summary;
  }, [projects]);

  const handleCreate = async () => {
    if (!user) {
      setError("请先登录后再创建项目");
      router.push("/login");
      return;
    }
    setError(null);
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
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="workspace" />
        <main className="space-y-6">
          <TopNav
            onCreate={handleCreate}
            creating={creating}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            title={user?.username ? `早安，${user.username}` : "工作台"}
            subtitle="准备好开始今天的创作了吗？"
          />

          {!user ? (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
              当前未登录，请先登录后查看你的项目与状态。
            </div>
          ) : null}
          {error ? <ErrorBanner message={error} /> : null}
          {listError ? <ErrorBanner message={listError} /> : null}

          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-semibold">快捷入口</div>
              <div className="mt-1 text-sm text-muted">
                继续上次编辑或快速创建新的剧本项目。
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCreate} loading={creating}>
                新建项目
              </Button>
              <Button
                variant="ghost"
                disabled={!lastActive}
                onClick={() => {
                  if (lastActive) {
                    router.push(`/projects/${lastActive.id}/editor/overview`);
                  }
                }}
              >
                继续上次编辑
              </Button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <KpiCard title="草稿项目" value={statusSummary.draft} helper="本周" />
            <KpiCard
              title="进行中"
              value={statusSummary.inProgress}
              helper="推进中"
              accent="amber"
            />
            <KpiCard
              title="已锁定真相"
              value={statusSummary.locked}
              helper="已锁定"
              accent="emerald"
            />
            <KpiCard title="本周创作时长" value="--" helper="小时" accent="slate" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="glass-panel-strong px-6 py-5">
              <div className="text-sm font-semibold">通知 / 待处理</div>
              <div className="mt-3 space-y-2 text-sm text-muted">
                <div>暂无新的 AI 审查结果</div>
                <div>暂无一致性异常</div>
                <div>暂无协作邀请</div>
              </div>
            </div>
            <div className="glass-panel-strong px-6 py-5">
              <div className="text-sm font-semibold">创作提醒</div>
              <div className="mt-3 text-sm text-muted">
                继续保持创作节奏，锁定真相后可解锁派生生成。
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-semibold">最近编辑</div>
              <div className="text-xs text-muted">共 {projects.length} 个项目</div>
            </div>
            {loading ? (
              <EmptyState title="加载中…" description="正在读取项目列表" />
            ) : recentProjects.length === 0 ? (
              <EmptyState title="暂无项目" description="点击右上角新建项目" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {recentProjects.map((item) => (
                  <ProjectCard
                    key={item.id}
                    project={item}
                    variant="compact"
                    onClick={() => router.push(`/projects/${item.id}/preview`)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
