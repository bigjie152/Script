import { useEffect } from "react";
import { Button } from "../common/Button";

type TopNavProps = {
  onCreate: () => void;
  creating?: boolean;
  searchValue?: string;
  onSearchChange?: (next: string) => void;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
};

export function TopNav({
  onCreate,
  creating,
  searchValue,
  onSearchChange,
  title = "工作台",
  subtitle = "继续你的创作与协作之旅。",
  showTitle = true
}: TopNavProps) {
  const hasTitle = showTitle && (title || subtitle);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {hasTitle ? (
        <div>
          <div className="text-2xl font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted">{subtitle}</div>
        </div>
      ) : null}
      <div className="flex flex-1 justify-center">
        <div className="glass-panel-strong flex w-full max-w-md items-center gap-3 rounded-full px-4 py-2 text-sm text-muted">
          <span className="text-xs">搜索</span>
          <input
            id="global-search"
            className="w-full bg-transparent text-sm text-ink outline-none"
            placeholder="搜索项目或社区..."
            value={searchValue || ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-muted">
            Ctrl K
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="glass-panel-strong flex h-10 w-10 items-center justify-center rounded-full text-muted"
          type="button"
          aria-label="通知"
        >
          通知
        </button>
        <Button
          onClick={onCreate}
          loading={creating}
          className="shadow-[0_8px_20px_-12px_rgba(67,56,202,0.5)]"
        >
          新建项目
        </Button>
      </div>
    </div>
  );
}
