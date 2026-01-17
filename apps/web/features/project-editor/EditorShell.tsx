"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/common/Button";
import { EditorSurface } from "../../components/editor/EditorSurface";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { TabGroup } from "../../components/common/TabGroup";
import { useTruthDocument } from "../../hooks/useTruthDocument";
import { useModuleDocument } from "../../hooks/useModuleDocument";
import { useMockAiTasks } from "../../hooks/useMockAi";
import { AIPanel } from "../ai-panel/AIPanel";
import { IssuePanel } from "../issue-panel/IssuePanel";
import { ModuleKey as DocModuleKey } from "../../services/moduleApi";

const MODULES = [
  { key: "overview", label: "概览" },
  { key: "truth", label: "真相" },
  { key: "roles", label: "角色" },
  { key: "clues", label: "线索" },
  { key: "timeline", label: "时间线" },
  { key: "dm", label: "DM 手册" }
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

type EditorShellProps = {
  projectId: string;
  module: ModuleKey;
};

export function EditorShell({ projectId, module }: EditorShellProps) {
  const router = useRouter();
  const {
    project,
    truth,
    latestSnapshotId,
    loading,
    error,
    text,
    setText,
    save,
    saveState,
    saveError,
    hasUnsaved,
    locked,
    lock,
    unlock
  } = useTruthDocument(projectId);
  const moduleDocKey = (module === "truth" ? null : module) as DocModuleKey | null;
  const moduleDoc = useModuleDocument(projectId, moduleDocKey);
  const { deriveRoles, reviewLogic } = useMockAiTasks();
  const [tab, setTab] = useState("ai");
  const [panelError, setPanelError] = useState<string | null>(null);

  const moduleLabel = useMemo(() => {
    return MODULES.find((item) => item.key === module)?.label || "概览";
  }, [module]);

  const saveLabel = useMemo(() => {
    const state = module === "truth" ? saveState : moduleDoc.saveState;
    switch (state) {
      case "saving":
        return "保存中…";
      case "success":
        return "已保存";
      case "error":
        return "保存失败";
      default:
        return "保存";
    }
  }, [module, saveState, moduleDoc.saveState]);

  const handleBack = () => {
    router.push("/workspace");
  };

  const handleLock = async () => {
    setPanelError(null);
    try {
      await lock();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "锁定失败，请重试");
    }
  };

  const handleUnlock = async () => {
    const ok = window.confirm(
      "解锁后将允许修改真相内容，可能影响派生结果一致性，确定解锁吗？"
    );
    if (!ok) return;
    setPanelError(null);
    try {
      await unlock();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "解锁失败，请重试");
    }
  };

  const handleDeriveRoles = () => {
    if (!locked) return;
    setPanelError(null);
    deriveRoles.run();
  };

  const handleReviewLogic = () => {
    setPanelError(null);
    reviewLogic.run();
  };

  const handleNav = (next: ModuleKey) => {
    router.push(`/projects/${projectId}/editor/${next}`);
  };

  const activeLoading = module === "truth" ? loading : moduleDoc.loading;
  const activeError = module === "truth" ? error : moduleDoc.error;
  const activeText = module === "truth" ? text : moduleDoc.text;
  const activeSaveError = module === "truth" ? saveError : moduleDoc.saveError;
  const activeHasUnsaved = module === "truth" ? hasUnsaved : moduleDoc.hasUnsaved;

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">
            {project?.name || "未命名项目"}
          </div>
          <div className="text-xs text-muted">
            {module === "truth"
              ? locked
                ? "真相已锁定"
                : hasUnsaved
                  ? "有未保存修改"
                  : "已保存"
              : activeHasUnsaved
                ? "有未保存修改"
                : "已保存"}
          </div>
        </div>
        <Button onClick={handleBack}>返回 Workspace</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="glass-panel-strong h-fit p-4">
          <div className="text-xs text-muted">模块导航</div>
          <div className="mt-4 space-y-1">
            {MODULES.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  item.key === module
                    ? "bg-white text-ink shadow-soft"
                    : "text-muted hover:bg-white/50 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 text-xs text-muted">
            项目：{project?.name || "加载中…"}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <div className="text-lg font-semibold">{moduleLabel}</div>
              <div className="text-xs text-muted">
                {module === "truth"
                  ? locked
                    ? "当前真相已锁定"
                    : "真相可编辑"
                  : "模块内容"}
              </div>
            </div>
            <Button
              onClick={module === "truth" ? save : moduleDoc.save}
              loading={
                module === "truth"
                  ? saveState === "saving"
                  : moduleDoc.saveState === "saving"
              }
              disabled={module === "truth" ? locked : false}
            >
              {saveLabel}
            </Button>
          </div>

          {activeLoading ? (
            <EmptyState title="加载中…" description="正在读取项目数据" />
          ) : activeError ? (
            <ErrorBanner message={activeError} />
          ) : module === "overview" ? (
            <div className="space-y-4">
              <div className="glass-panel-strong px-8 py-6">
                <div className="text-xl font-semibold">
                  {project?.name || "未命名项目"}
                </div>
                <div className="mt-2 text-sm text-muted">
                  {project?.description || "暂无描述"}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted">
                  <div>
                    <div className="text-xs">创建时间</div>
                    <div className="mt-1 text-ink">
                      {project?.createdAt || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs">更新时间</div>
                    <div className="mt-1 text-ink">
                      {project?.updatedAt || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs">Truth ID</div>
                    <div className="mt-1 text-ink">{truth?.id || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs">状态</div>
                    <div className="mt-1 text-ink">
                      {locked ? "已锁定" : "草稿"}
                    </div>
                  </div>
                </div>
              </div>
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              <EditorSurface
                value={activeText}
                onChange={moduleDoc.setText}
              />
            </div>
          ) : module === "truth" ? (
            <div className="space-y-3">
              {saveError ? <ErrorBanner message={saveError} /> : null}
              {locked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相已锁定，编辑区为只读。解锁后可继续修改。
                </div>
              ) : null}
              <EditorSurface value={text} onChange={setText} editable={!locked} />
            </div>
          ) : (
            <div className="space-y-3">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              <EditorSurface value={activeText} onChange={moduleDoc.setText} />
            </div>
          )}
        </main>

        <aside className="space-y-4">
          <TabGroup
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "ai", label: "AI 面板" },
              { key: "issues", label: "问题列表" }
            ]}
          />
          {tab === "ai" ? (
            <>
              {panelError ? <ErrorBanner message={panelError} /> : null}
              <AIPanel
                locked={locked}
                onLock={handleLock}
                onUnlock={handleUnlock}
                onDeriveRoles={handleDeriveRoles}
                deriveStatus={deriveRoles.status}
                deriveMessage={deriveRoles.message}
                onReviewLogic={handleReviewLogic}
                reviewStatus={reviewLogic.status}
                reviewMessage={reviewLogic.message}
              />
            </>
          ) : (
            <IssuePanel
              projectId={projectId}
              truthSnapshotId={latestSnapshotId}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
