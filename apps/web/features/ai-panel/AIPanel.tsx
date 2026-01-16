"use client";

import { Button } from "../../components/common/Button";

type AIPanelProps = {
  locked: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onDeriveRoles: () => void;
};

export function AIPanel({
  locked,
  onLock,
  onUnlock,
  onDeriveRoles
}: AIPanelProps) {
  const statusLabel = locked ? "已锁定（Locked）" : "草稿（Draft）";

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">Truth 核心控制</div>
        <div className="mt-2 text-xs text-muted">
          当前状态：<span className="font-medium text-ink">{statusLabel}</span>
        </div>
        <div className="mt-2 text-xs text-muted">
          {locked
            ? "当前真相已锁定，编辑区为只读。"
            : "锁定后将进入只读状态，便于派生生成。"}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={locked ? onUnlock : onLock}>
            {locked ? "解锁真相" : "锁定真相"}
          </Button>
        </div>
      </div>

      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">派生生成</div>
        <div className="mt-2 text-xs text-muted">
          派生能力依赖已锁定的 Truth。
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="primary" onClick={onDeriveRoles} disabled={!locked}>
            生成角色
          </Button>
          <div className="text-xs text-muted">
            {locked ? "功能即将上线" : "请先锁定真相"}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            线索
            <div className="mt-1 text-[11px] text-muted">即将上线</div>
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            时间线
            <div className="mt-1 text-[11px] text-muted">即将上线</div>
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            DM 手册
            <div className="mt-1 text-[11px] text-muted">即将上线</div>
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            逻辑审查
            <div className="mt-1 text-[11px] text-muted">即将上线</div>
          </div>
        </div>
      </div>
    </div>
  );
}
