"use client";

import { Button } from "../../components/common/Button";

type AIPanelProps = {
  truthStatus?: string | null;
  onLock: () => void;
  onUnlock?: () => void;
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
  onUnlock,
  onDeriveRoles,
  onCheckConsistency,
  loading
}: AIPanelProps) {
  const isLocked = truthStatus === "LOCKED";
  const statusLabel = isLocked ? "Locked" : "Draft";
  const canDerive = isLocked;

  return (
    <div className="space-y-4">
      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">Truth Core</div>
        <div className="mt-2 text-xs text-muted">
          Status: <span className="font-medium text-ink">{statusLabel}</span>
        </div>
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            onClick={isLocked ? onUnlock : onLock}
            loading={loading?.lock}
            disabled={isLocked ? !onUnlock : false}
          >
            {isLocked ? "Unlock Truth" : "Lock Truth"}
          </Button>
          {isLocked && !onUnlock ? (
            <div className="text-xs text-muted">
              Unlock not supported yet (backend missing).
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">Derivations</div>
        <div className="mt-2 text-xs text-muted">
          Derivations require locked Truth.
        </div>
        <div className="mt-4 space-y-2">
          <Button
            variant="primary"
            onClick={onDeriveRoles}
            loading={loading?.derive}
            disabled={!canDerive}
          >
            Generate Roles
          </Button>
          {!canDerive ? (
            <div className="text-xs text-muted">Lock Truth first.</div>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            Clues
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            Timeline
          </div>
          <div className="rounded-xl border border-dashed border-white/60 px-3 py-2">
            DM Guide
          </div>
        </div>
      </div>

      <div className="glass-panel-strong p-5">
        <div className="text-sm font-semibold">Consistency Check</div>
        <div className="mt-2 text-xs text-muted">
          Run a consistency check for the latest snapshot.
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={onCheckConsistency}
            loading={loading?.check}
          >
            Run Check
          </Button>
        </div>
      </div>
    </div>
  );
}
