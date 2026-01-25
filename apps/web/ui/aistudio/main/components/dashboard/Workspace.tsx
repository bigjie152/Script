"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Activity, PlayCircle, Plus } from "lucide-react";
import ProjectCard, { ProjectCardItem } from "./ProjectCard";
import { ProjectStatus } from "../../types/types";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { createProject } from "@/services/projectApi";

const Workspace: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, loading, error: listError } = useProjects({
    sort: "updatedAt"
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const recentProjects = useMemo(() => cardProjects.slice(0, 3), [cardProjects]);
  const lastActiveProject = recentProjects[0];

  const counts = useMemo(() => {
    const summary = { draft: 0, locked: 0, published: 0 };
    cardProjects.forEach((project) => {
      if (project.status === ProjectStatus.PUBLISHED) summary.published += 1;
      else if (project.status === ProjectStatus.LOCKED) summary.locked += 1;
      else summary.draft += 1;
    });
    return summary;
  }, [cardProjects]);

  const handleCreate = async () => {
    if (!user || creating) {
      if (!user) setError("请先登录后再创建项目");
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
      if (projectId) {
        router.push(`/projects/${projectId}/editor/overview`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {user?.username ? `早安，${user.username}` : "工作台"}
          </h2>
          <p className="text-gray-500 mt-1">开启你的创作之旅，马上进入创作。</p>
        </div>
        <div className="flex gap-3">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
              lastActiveProject
                ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            type="button"
            onClick={() => {
              if (!lastActiveProject) return;
              router.push(`/projects/${lastActiveProject.id}/editor/overview`);
            }}
          >
            <PlayCircle size={16} className="text-indigo-600" />
            继续：{lastActiveProject?.title || "暂无项目"}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg ${
              creating || !user
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300"
            }`}
            type="button"
            onClick={handleCreate}
            disabled={creating || !user}
          >
            <Plus size={16} />
            {creating ? "创建中..." : "新建项目"}
          </button>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
          当前未登录，请先登录后查看你的项目与状态。
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      {listError ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/70 px-4 py-3 text-xs text-red-700">
          {listError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-gray-500 text-sm font-medium">进行中（草稿）</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{counts.draft}</span>
            <div className="h-1.5 w-12 bg-amber-100 rounded-full mb-2">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-gray-500 text-sm font-medium">已锁定（Truth）</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{counts.locked}</span>
            <div className="h-1.5 w-12 bg-gray-100 rounded-full mb-2">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: "30%" }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
          <span className="text-gray-500 text-sm font-medium">已发布</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{counts.published}</span>
            <div className="h-1.5 w-12 bg-green-100 rounded-full mb-2">
              <div className="h-full bg-green-400 rounded-full" style={{ width: "80%" }}></div>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/projects")}
          className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center items-center h-28 cursor-pointer hover:bg-indigo-100 transition-colors group"
          type="button"
        >
          <span className="text-indigo-600 font-bold text-lg group-hover:scale-105 transition-transform">
            查看全部项目 →
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Bell size={18} className="text-gray-400" />
          待处理事项
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <div className="bg-white p-3 rounded-full shadow-sm mb-3">
            <Activity size={20} className="text-green-500" />
          </div>
          <p className="text-sm">太棒了！当前没有待处理的异常或审查。</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">最近编辑</h3>
          <button
            onClick={() => router.push("/projects")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            type="button"
          >
            管理所有项目
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-400">加载中…</div>
        ) : recentProjects.length === 0 ? (
          <div className="text-sm text-gray-400">暂无项目</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.id}/preview`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function resolveStatus(status?: string, truthStatus?: string) {
  const rawStatus = (status || "").toLowerCase();
  const rawTruth = (truthStatus || "").toLowerCase();
  if (rawStatus.includes("published") || rawStatus.includes("公开") || rawStatus.includes("发布")) {
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

export default Workspace;
