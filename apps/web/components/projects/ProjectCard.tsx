import { ProjectListItem } from "../../services/projectApi";
import { formatRelativeTime, formatTruthStatus, getProgress } from "./projectUtils";

export type ProjectCardVariant = "grid" | "list" | "compact";

type ProjectCardProps = {
  project: ProjectListItem;
  variant?: ProjectCardVariant;
  onClick?: () => void;
};

export function ProjectCard({ project, variant = "grid", onClick }: ProjectCardProps) {
  const isList = variant === "list";
  const isCompact = variant === "compact";

  return (
    <button
      onClick={onClick}
      className={
        isList
          ? "glass-panel-strong flex flex-col gap-3 px-5 py-4 text-left transition hover:-translate-y-0.5"
          : "glass-panel-strong flex flex-col gap-4 px-5 py-4 text-left transition hover:-translate-y-1"
      }
      type="button"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-muted">
          {formatTruthStatus(project.truthStatus)}
        </span>
        <span className="text-xs text-muted">{formatRelativeTime(project.updatedAt)}</span>
      </div>
      <div className={isCompact ? "text-base font-semibold" : "text-lg font-semibold"}>
        {project.name || "未命名项目"}
      </div>
      <div className="text-sm text-muted">
        {project.description || "暂无简介"}
      </div>
      {!isCompact ? (
        <div className="mt-auto space-y-2">
          <div className="text-xs text-muted">进度</div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-indigo-500"
              style={{ width: `${getProgress(project)}%` }}
            />
          </div>
          <div className="text-xs text-muted">
            最后编辑于 {formatRelativeTime(project.updatedAt)}
          </div>
        </div>
      ) : null}
    </button>
  );
}
