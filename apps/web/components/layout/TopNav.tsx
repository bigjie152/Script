import { Button } from "../common/Button";

type TopNavProps = {
  onCreate: () => void;
  creating?: boolean;
  user?: { username: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
};

export function TopNav({
  onCreate,
  creating,
  user,
  onLogin,
  onLogout
}: TopNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-2xl font-semibold">工作台</div>
        <div className="mt-1 text-sm text-muted">继续你的创作与协作之旅。</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-panel-strong hidden items-center gap-2 rounded-full px-4 py-2 text-sm text-muted lg:flex">
          <span className="text-xs">搜索</span>
          <span>搜索项目...</span>
        </div>
        <button
          className="glass-panel-strong flex h-10 w-10 items-center justify-center rounded-full text-muted"
          type="button"
          aria-label="通知"
        >
          通知
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="glass-panel-strong rounded-full px-3 py-2 text-xs text-ink">
              {user.username}
            </div>
            <Button variant="ghost" onClick={onLogout}>
              退出
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={onLogin}>
            登录
          </Button>
        )}
        <Button onClick={onCreate} loading={creating}>
          新建项目
        </Button>
      </div>
    </div>
  );
}
