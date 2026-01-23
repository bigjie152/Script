import { CommunityProjectListItem } from "../../services/communityApi";
import { formatRelativeTime, formatTruthStatus } from "../projects/projectUtils";

type CommunityProjectCardProps = {
  project: CommunityProjectListItem;
  onClick?: () => void;
};

export function CommunityProjectCard({ project, onClick }: CommunityProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-panel-strong flex h-full flex-col gap-4 px-5 py-4 text-left transition hover:-translate-y-1"
    >
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="rounded-full border border-slate-200 px-3 py-1">
          {formatTruthStatus(project.truthStatus)}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            AI {project.aiStatus.issueCount}
          </span>
          <span className="font-semibold text-ink">
            {project.ratingSummary.displayScore.toFixed(1)} 分
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-lg font-semibold">{project.name}</div>
        <div className="text-sm text-muted line-clamp-2">
          {project.intro || project.description || "暂无简介"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {project.genre || "题材待补充"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {project.players || "人数未知"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          作者：{project.author.username}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div>👍 {project.counts.likes}</div>
        <div>💬 {project.counts.comments}</div>
        <div>收藏 {project.counts.favorites}</div>
        <div>{formatRelativeTime(project.updatedAt || project.publishedAt || "")}</div>
      </div>
    </button>
  );
}
