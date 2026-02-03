"use client";

import { Button } from "../../components/common/Button";

type AiStatus = "idle" | "pending" | "success" | "error";

type AIPanelProps = {
  locked: boolean;
  onLock: () => void;
  onUnlock: () => void;
  unlockConfirmOpen?: boolean;
  onUnlockConfirm?: () => void;
  onUnlockCancel?: () => void;
  onReviewLogic: () => void;
  reviewStatus?: AiStatus;
  reviewMessage?: string | null;
};

export function AIPanel({
  locked,
  onLock,
  onUnlock,
  unlockConfirmOpen = false,
  onUnlockConfirm,
  onUnlockCancel,
  onReviewLogic,
  reviewStatus,
  reviewMessage
}: AIPanelProps) {
  const statusLabel = locked ? "已锁定（Locked）" : "草稿（Draft）";
  const reviewHint =
    reviewMessage ||
    (locked ? "可进行逻辑审查（Mock）" : "未锁定也可检查，锁定后更有意义");

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
          {locked ? (
            unlockConfirmOpen ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={onUnlockConfirm}>
                  确认解锁
                </Button>
                <Button variant="ghost" onClick={onUnlockCancel}>
                  取消
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onUnlock}>
                解锁真相
              </Button>
            )
          ) : (
            <Button variant="outline" onClick={onLock}>
              锁定真相
            </Button>
          )}
        </div>
      </div>

      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">逻辑审查</div>
        <div className="mt-2 text-xs text-muted">
          对当前真相进行一致性检查并同步问题列表。
        </div>
        <div className="mt-4 space-y-2">
          <Button
            variant="primary"
            onClick={onReviewLogic}
            loading={reviewStatus === "pending"}
          >
            运行一致性检查
          </Button>
          <div
            className={`text-xs ${
              reviewStatus === "error" ? "text-red-500" : "text-muted"
            }`}
          >
            {reviewHint}
          </div>
        </div>
      </div>
    </div>
  );
}
