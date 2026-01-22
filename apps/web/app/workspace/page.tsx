"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { useAuth } from "../../hooks/useAuth";
import { createProject, listProjects, ProjectListItem } from "../../services/projectApi";

export default function WorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
        const result = await listProjects({ scope: "mine", sort: "updatedAt", q: searchQuery });
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
  }, [user, searchQuery]);

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

  const handlePreview = (projectId: string) => {
    router.push(`/projects/${projectId}/preview`);
  };

  const listMeta = useMemo(() => {
    if (!projects.length) return "暂无项目";
    return `共 ${projects.length} 个项目`;
  }, [projects.length]);

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
          />

          {!user ? (
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
              当前未登录，请先登录后查看你的项目列表。
            </div>
          ) : null}
          {error ? <ErrorBanner message={error} /> : null}

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-semibold">我的项目</div>
              <div className="text-xs text-muted">{listMeta}</div>
            </div>
            {loading ? (
              <EmptyState title="加载中…" description="正在读取项目列表" />
            ) : projects.length === 0 ? (
              <EmptyState title="暂无项目" description="点击右上角新建项目" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {projects.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePreview(item.id)}
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
                    <div className="text-lg font-semibold">
                      {item.name || "未命名项目"}
                    </div>
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
          </section>
        </main>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
