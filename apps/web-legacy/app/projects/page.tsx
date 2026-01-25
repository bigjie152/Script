"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { useAuth } from "../../hooks/useAuth";
import { useProjects } from "../../hooks/useProjects";
import { createProject } from "../../services/projectApi";

type SortKey = "updatedAt" | "status" | "truthStatus" | "progress";

type ViewMode = "grid" | "list";

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [truthFilter, setTruthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { projects, loading, error: listError } = useProjects({
    scope: "mine",
    sort: sortKey,
    q: searchQuery,
    status: statusFilter || undefined,
    truthStatus: truthFilter || undefined
  });

  const sortedProjects = useMemo(() => {
    if (sortKey === "updatedAt") return projects;
    const copy = [...projects];
    if (sortKey === "status") {
      const order = ["Draft", "In Progress", "Completed"];
      return copy.sort(
        (a, b) => order.indexOf(a.status || "Draft") - order.indexOf(b.status || "Draft")
      );
    }
    if (sortKey === "truthStatus") {
      const order = ["Draft", "Locked"];
      return copy.sort(
        (a, b) =>
          order.indexOf(a.truthStatus || "Draft") - order.indexOf(b.truthStatus || "Draft")
      );
    }
    if (sortKey === "progress") {
      return copy;
    }
    return copy;
  }, [projects, sortKey]);

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
        <Sidebar activeKey="projects" />
        <main className="space-y-6">
          <TopNav
            onCreate={handleCreate}
            creating={creating}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            title="我的项目"
            subtitle="管理与检索你的创作资产。"
          />

          {!user ? (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
              当前未登录，请先登录后查看你的项目列表。
            </div>
          ) : null}
          {error ? <ErrorBanner message={error} /> : null}
          {listError ? <ErrorBanner message={listError} /> : null}

          <div className="glass-panel-strong flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-muted">
            <div className="flex items-center gap-2">
              <span>筛选：</span>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink"
                value={truthFilter}
                onChange={(event) => setTruthFilter(event.target.value)}
              >
                <option value="">全部真相状态</option>
                <option value="Draft">草稿</option>
                <option value="Locked">已锁定</option>
              </select>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部项目状态</option>
                <option value="Draft">草稿</option>
                <option value="In Progress">进行中</option>
                <option value="Completed">已完成</option>
              </select>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span>排序：</span>
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                >
                  <option value="updatedAt">最近更新</option>
                  <option value="progress">进度</option>
                  <option value="status">项目状态</option>
                  <option value="truthStatus">真相状态</option>
                </select>
              </div>
              <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 text-xs">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${
                    viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-muted"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  网格
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${
                    viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-muted"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  列表
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <EmptyState title="加载中…" description="正在读取项目列表" />
          ) : sortedProjects.length === 0 ? (
            <EmptyState title="暂无项目" description="点击右上角新建项目" />
          ) : (
            <div
              className={
                viewMode === "grid" ? "grid gap-4 lg:grid-cols-3" : "grid gap-3"
              }
            >
              {sortedProjects.map((item) => (
                <ProjectCard
                  key={item.id}
                  project={item}
                  variant={viewMode === "grid" ? "grid" : "list"}
                  onClick={() => router.push(`/projects/${item.id}/preview`)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => router.push("/workspace")}>
              返回工作台
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
