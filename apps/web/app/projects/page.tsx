"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { useAuth } from "../../hooks/useAuth";
import { createProject, listProjects, ProjectListItem } from "../../services/projectApi";

type SortKey = "updatedAt" | "status" | "truthStatus" | "progress";

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [truthFilter, setTruthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await listProjects({
          scope: "mine",
          sort: sortKey,
          q: searchQuery,
          status: statusFilter || undefined,
          truthStatus: truthFilter || undefined
        });
        if (!alive) return;
        setProjects(result.projects || []);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载失败，请重试");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [user, searchQuery, truthFilter, statusFilter, sortKey]);

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
      return copy.sort((a, b) => getProgress(b) - getProgress(a));
    }
    return copy;
  }, [projects, sortKey]);

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

          <div className="glass-panel-strong flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-muted">
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
            <span className="ml-auto">排序：</span>
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

          {loading ? (
            <EmptyState title="加载中…" description="正在读取项目列表" />
          ) : sortedProjects.length === 0 ? (
            <EmptyState title="暂无项目" description="点击右上角新建项目" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {sortedProjects.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/projects/${item.id}/preview`)}
                  className="glass-panel-strong flex flex-col gap-4 px-5 py-4 text-left transition hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-muted">
                      {formatTruthStatus(item.truthStatus)}
                    </span>
                    <span className="text-xs text-muted">
                      {formatRelativeTime(item.updatedAt)}
                    </span>
                  </div>
                  <div className="text-lg font-semibold">{item.name || "未命名项目"}</div>
                  <div className="text-sm text-muted">
                    {item.description || "暂无简介"}
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="text-xs text-muted">进度</div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${getProgress(item)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted">
                      最后编辑于 {formatRelativeTime(item.updatedAt)}
                    </div>
                  </div>
                </button>
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

function formatTruthStatus(status?: string) {
  if (status === "Locked") return "已锁定";
  return "草稿";
}

function formatRelativeTime(value?: string) {
  if (!value) return "-";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return `${Math.floor(diff / day)} 天前`;
}

function getProgress(item: ProjectListItem) {
  if (item.status === "Completed") return 100;
  if (item.status === "In Progress") return 45;
  if (item.truthStatus === "Locked") return 60;
  return 12;
}
