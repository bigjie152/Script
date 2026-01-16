"use client";

import { Button } from "../../components/common/Button";

type AIPanelProps = {
  truthStatus?: string | null;
  onLock: () => void;
  onDeriveRoles: () => void;
  onCheckConsistency: () => void;
  loading?: {
    lock?: boolean;
    derive?: boolean;
    check?: boolean;
  };
};

export function AIPanel({
  truthStatus,
  onLock,
  onDeriveRoles,
  onCheckConsistency,
  loading
}: AIPanelProps) {
  const isLocked = truthStatus === "LOCKED";
  const statusLabel = isLocked ? "已锁定 (Locked)" : "草稿 (Draft)";

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">Truth 核心控制</div>
        <div className="mt-2 text-xs text-muted">
          当前状态：<span className="font-medium text-ink">{statusLabel}</span>
        </div>
        <div className="mt-4 space-y-3">
          <Button
            variant="outline"
            onClick={onLock}
            loading={loading?.lock}
            disabled={isLocked}
          >
            {isLocked ? "已锁定" : "锁定真相"}
          </Button>
          <Button
            variant="primary"
            onClick={onDeriveRoles}
            loading={loading?.derive}
          >
            生成角色
          </Button>
        </div>
      </div>

      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">逻辑审查</div>
        <div className="mt-2 text-xs text-muted">
          对当前版本进行一致性检查。
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={onCheckConsistency}
            loading={loading?.check}
          >
            一致性检查
          </Button>
        </div>
      </div>

      <div className="glass-panel-strong p-5 opacity-60">
        <div className="text-sm font-semibold">派生生成（待上线）</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            线索 Clues
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            时间线 Timeline
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            DM 手册
          </div>
        </div>
      </div>
    </div>
  );
}
