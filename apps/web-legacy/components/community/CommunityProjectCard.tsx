import { CommunityProjectListItem } from "../../services/communityApi";
import { formatRelativeTime } from "../projects/projectUtils";

type CommunityProjectCardProps = {
  project: CommunityProjectListItem;
  onClick?: () => void;
};

export function CommunityProjectCard({ project, onClick }: CommunityProjectCardProps) {
  const truthLocked = project.truthStatus === "Locked";
  const aiPass = project.aiStatus.issueCount === 0 && !project.aiStatus.hasP0;
  const rating = Number.isFinite(project.ratingSummary.displayScore)
    ? project.ratingSummary.displayScore
    : 0;
  const metaLine = [project.genre, project.players].filter(Boolean).join(" / ");
  const description = project.intro || project.description || "暂无简介";
  const updatedLabel = formatRelativeTime(project.updatedAt || project.publishedAt || "");

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-panel-strong flex h-full flex-col overflow-hidden text-left transition hover:-translate-y-1"
    >
      <div className="relative h-28 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 px-4 py-4 text-white">
        <div className="flex items-center justify-end gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-white/20 px-2 py-0.5">Truth</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            {aiPass ? "AI Pass" : "AI Check"}
          </span>
        </div>
        {metaLine ? (
          <div className="mt-8 text-xs font-medium text-white/80">{metaLine}</div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-ink">{project.name}</div>
            <div className="text-xs text-muted">by {project.author.username}</div>
          </div>
          <div className="flex items-center gap-1 text-sm text-amber-500">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 15.27 4.18 18l1.11-6.47L.59 6.5l6.53-.95L10 .5l2.88 5.05 6.53.95-4.7 5.03L15.82 18 10 15.27z" />
            </svg>
            <span className="text-xs text-ink">{rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-muted">{description}</p>
        <div className="mt-auto flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              ❤ {project.counts.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              💬 {project.counts.comments}
            </span>
          </div>
          <span>{updatedLabel}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span
            className={`rounded-full px-2 py-0.5 ${
              truthLocked ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-muted"
            }`}
          >
            {truthLocked ? "已锁定" : "草稿"}
          </span>
        </div>
      </div>
    </button>
  );
}
