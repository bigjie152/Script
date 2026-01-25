"use client";

import { Clock, MoreHorizontal, Lock } from "lucide-react";
import { ProjectStatus } from "../../types/types";

export type ProjectCardItem = {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  updatedAt?: string | null;
  progress: number;
};

interface ProjectCardProps {
  project: ProjectCardItem;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.LOCKED:
        return "bg-gray-100 text-gray-600 border-gray-200";
      case ProjectStatus.PUBLISHED:
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const lastEdited = formatRelativeTime(project.updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-100 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
            project.status
          )} flex items-center gap-1.5`}
        >
          {project.status === ProjectStatus.LOCKED && <Lock size={10} />}
          {project.status}
        </span>
        <span className="text-gray-300 group-hover:text-gray-600 transition-colors">
          <MoreHorizontal size={18} />
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {project.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
          {project.description || "暂无简介"}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-500 font-medium">进度</span>
          <span className="text-indigo-600 font-bold">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>最后编辑于 {lastEdited}</span>
        </div>
        <div className="flex -space-x-2">
          <div className="w-5 h-5 rounded-full bg-purple-200 border border-white flex items-center justify-center text-[8px] text-purple-700">
            A
          </div>
          <div className="w-5 h-5 rounded-full bg-indigo-200 border border-white flex items-center justify-center text-[8px] text-indigo-700">
            Y
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl pointer-events-none"></div>
    </button>
  );
};

function formatRelativeTime(value?: string | null) {
  if (!value) return "未知";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "未知";
  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return `${Math.floor(diff / day)} 天前`;
}

export default ProjectCard;
