import { Button } from "../common/Button";

type TopNavProps = {
  onCreate: () => void;
  creating?: boolean;
};

export function TopNav({ onCreate, creating }: TopNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-2xl font-semibold">工作台</div>
        <div className="mt-1 text-sm text-muted">继续你的创作与协作。</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="glass-panel-strong hidden items-center gap-2 rounded-full px-4 py-2 text-sm text-muted lg:flex">
          <span>🔍</span>
          <span>搜索项目...</span>
        </div>
        <button className="glass-panel-strong flex h-10 w-10 items-center justify-center rounded-full text-muted">
          🔔
        </button>
        <Button onClick={onCreate} loading={creating}>
          新建项目
        </Button>
      </div>
    </div>
  );
}
