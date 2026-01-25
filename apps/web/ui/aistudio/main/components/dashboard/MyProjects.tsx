"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, SortAsc, LayoutGrid, List } from "lucide-react";
import ProjectCard, { ProjectCardItem } from "./ProjectCard";
import { ProjectStatus } from "../../types/types";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";

const MyProjects: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { projects, loading, error } = useProjects({
    sort: "updatedAt",
    q: searchQuery
  });

  const cardProjects = useMemo<ProjectCardItem[]>(
    () =>
      projects.map((item) => ({
        id: item.id,
        title: item.name,
        description: item.description || "",
        status: resolveStatus(item.status, item.truthStatus),
        updatedAt: item.updatedAt || null,
        progress: resolveProgress(item.status, item.truthStatus)
      })),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    if (statusFilter === "ALL") return cardProjects;
    return cardProjects.filter((project) => project.status === statusFilter);
  }, [cardProjects, statusFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">我的项目</h2>
        <p className="text-gray-500">管理、检索与归档您的所有剧本资产。</p>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700 mb-6">
          当前未登录，请先登录后查看你的项目。
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-xs text-red-700 mb-6">
          {error}
        </div>
      ) : null}

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索项目名称或简介..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <Filter size={14} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer pr-8"
            >
              <option value="ALL">全部状态</option>
              <option value={ProjectStatus.DRAFT}>草稿</option>
              <option value={ProjectStatus.LOCKED}>已锁定（Truth）</option>
              <option value={ProjectStatus.PUBLISHED}>已发布</option>
            </select>
          </div>

          <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="排序" type="button">
            <SortAsc size={18} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid" ? "bg-white shadow text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
              type="button"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
              type="button"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">加载中...</div>
      ) : filteredProjects.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/projects/${project.id}/preview`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="opacity-50" />
          </div>
          <p>未找到匹配的项目</p>
          <button
            onClick={() => {
              setSearchInput("");
              setStatusFilter("ALL");
            }}
            className="mt-2 text-sm text-indigo-600 hover:underline"
            type="button"
          >
            清除筛选条件
          </button>
        </div>
      )}
    </div>
  );
};

function resolveStatus(status?: string, truthStatus?: string) {
  const rawStatus = (status || "").toLowerCase();
  const rawTruth = (truthStatus || "").toLowerCase();
  if (rawStatus.includes("published") || rawStatus.includes("发布") || rawStatus.includes("公开")) {
    return ProjectStatus.PUBLISHED;
  }
  if (rawTruth.includes("locked") || rawTruth.includes("锁定")) {
    return ProjectStatus.LOCKED;
  }
  return ProjectStatus.DRAFT;
}

function resolveProgress(status?: string, truthStatus?: string) {
  const normalized = resolveStatus(status, truthStatus);
  if (normalized === ProjectStatus.PUBLISHED) return 100;
  if (normalized === ProjectStatus.LOCKED) return 80;
  return 20;
}

export default MyProjects;
