"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCommunityProjects } from "@/hooks/useCommunityProjects";
import type { CommunityProjectListItem } from "@/services/communityApi";

type SortKey = "latest" | "hot";

function formatRelativeTime(value: string | null) {
  if (!value) return "刚刚";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function CommunityCard({
  project,
  onClick
}: {
  project: CommunityProjectListItem;
  onClick: () => void;
}) {
  const isLocked = project.truthStatus === "Locked";
  const aiPass = project.aiStatus.issueCount === 0 && !project.aiStatus.hasP0;
  const rating = project.ratingSummary?.displayScore ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-purple-500">
        <div className="absolute top-3 left-3 flex gap-2 text-xs text-white">
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            {isLocked ? "Truth" : "Draft"}
          </span>
          {aiPass ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5">AI Pass</span>
          ) : null}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{project.genre || "未分类"}</span>
          <span className="flex items-center gap-1 text-amber-500">
            ★ {rating.toFixed(1)}
          </span>
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-900 line-clamp-1">
            {project.name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            by {project.author?.username || "匿名作者"}
          </div>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2">
          {project.intro || project.description || "暂无简介"}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>最后编辑于 {formatRelativeTime(project.updatedAt)}</span>
          <div className="flex items-center gap-3">
            <span>❤ {project.counts.likes}</span>
            <span>💬 {project.counts.comments}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("hot");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { projects, loading, error } = useCommunityProjects({
    sort: sortKey,
    q: searchQuery
  });

  const cards = useMemo(() => projects || [], [projects]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">社区广场</h1>
          <p className="text-sm text-slate-500 mt-1">
            探索共创剧本，参与评分与讨论。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 text-xs">
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                sortKey === "hot" ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
              }`}
              onClick={() => setSortKey("hot")}
            >
              🔥 热门
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                sortKey === "latest" ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
              }`}
              onClick={() => setSortKey("latest")}
            >
              🕒 最新
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.9 14.32a7 7 0 1 1 1.414-1.414l3.387 3.386a1 1 0 0 1-1.414 1.415l-3.387-3.387Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              className="w-56 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
              placeholder="搜索剧本、作者..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">
          社区作品加载中...
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">
          暂无公开作品，稍后再来看看
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <CommunityCard
              key={item.id}
              project={item}
              onClick={() => router.push(`/community/projects/${item.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
