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
  const [sortKey, setSortKey] = useState<SortKey>("latest");
  const [genreFilter, setGenreFilter] = useState("");
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
    q: searchQuery,
    genre: genreFilter || undefined
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
            onSearchChange={setSearchInput}
            title="社区广场"
            subtitle="发现其他作者的优秀剧本与灵感。"
          />

          {error ? <ErrorBanner message={error} /> : null}
          {listError ? <ErrorBanner message={listError} /> : null}

          <div className="glass-panel-strong flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-muted">
            <span>排序：</span>
            <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-1">
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${
                  sortKey === "latest" ? "bg-indigo-50 text-indigo-600" : ""
                }`}
                onClick={() => setSortKey("latest")}
              >
                最新
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${
                  sortKey === "hot" ? "bg-indigo-50 text-indigo-600" : ""
                }`}
                onClick={() => setSortKey("hot")}
              >
                热门
              </button>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <span>题材：</span>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink"
                value={genreFilter}
                onChange={(event) => setGenreFilter(event.target.value)}
              >
                <option value="">全部</option>
                <option value="悬疑">悬疑</option>
                <option value="推理">推理</option>
                <option value="恐怖">恐怖</option>
                <option value="情感">情感</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <span className="ml-auto text-xs text-muted">
              仅展示公开发布作品
            </span>
          </div>

          {loading ? (
            <EmptyState title="加载中…" description="正在读取社区作品" />
          ) : projects.length === 0 ? (
            <EmptyState title="暂无公开作品" description="稍后再来看看" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
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
