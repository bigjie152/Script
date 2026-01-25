"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { CommunityProjectCard } from "../../components/community/CommunityProjectCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { useCommunityProjects } from "../../hooks/useCommunityProjects";
import { useAuth } from "../../hooks/useAuth";
import { createProject } from "../../services/projectApi";

type SortKey = "latest" | "hot";

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("hot");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { projects, loading, error: listError } = useCommunityProjects({
    sort: sortKey,
    q: searchQuery
  });

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
        <Sidebar activeKey="community" />
        <main className="space-y-6">
          <TopNav
            onCreate={handleCreate}
            creating={creating}
            searchValue={searchInput}
            showTitle={false}
            onSearchChange={setSearchInput}
          />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold">社区广场</div>
              <div className="mt-1 text-sm text-muted">
                探索共创剧本，参与评分与讨论。
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 text-xs">
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                    sortKey === "hot" ? "bg-indigo-50 text-indigo-600" : "text-muted"
                  }`}
                  onClick={() => setSortKey("hot")}
                >
                  <span className="text-sm">🔥</span>
                  热门
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                    sortKey === "latest" ? "bg-indigo-50 text-indigo-600" : "text-muted"
                  }`}
                  onClick={() => setSortKey("latest")}
                >
                  <span className="text-sm">🕒</span>
                  最新
                </button>
              </div>
              <div className="glass-panel-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.9 14.32a7 7 0 1 1 1.414-1.414l3.387 3.386a1 1 0 0 1-1.414 1.415l-3.387-3.387Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  className="w-56 bg-transparent text-sm text-ink outline-none"
                  placeholder="搜索剧本、作者..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
            </div>
          </div>

          {error ? <ErrorBanner message={error} /> : null}
          {listError ? <ErrorBanner message={listError} /> : null}

          {loading ? (
            <EmptyState title="加载中…" description="正在读取社区作品" />
          ) : projects.length === 0 ? (
            <EmptyState title="暂无公开作品" description="稍后再来看看" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((item) => (
                <CommunityProjectCard
                  key={item.id}
                  project={item}
                  onClick={() => router.push(`/community/projects/${item.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
