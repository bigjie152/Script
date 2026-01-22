"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/common/Button";
import { EntryList } from "../../components/editor/EntryList";
import { DocumentEditor } from "../../editors/DocumentEditor";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { TabGroup } from "../../components/common/TabGroup";
import { useTruthDocument } from "../../hooks/useTruthDocument";
import { useModuleDocument } from "../../hooks/useModuleDocument";
import { useModuleCollection } from "../../hooks/useModuleCollection";
import { useAuth } from "../../hooks/useAuth";
import { useMockAiTasks } from "../../hooks/useMockAi";
import { useProjectMeta } from "../../hooks/useProjectMeta";
import { deserializeDocument } from "../../editors/adapters/plainTextAdapter";
import { AIPanel } from "../ai-panel/AIPanel";
import { IssuePanel } from "../issue-panel/IssuePanel";
import {
  MODULE_CONFIGS,
  MODULE_CONFIG_MAP,
  isDocumentModuleKey
} from "../../modules/modules.config";
import { DocumentModuleKey, EditorModuleKey } from "../../types/editorDocument";
import { MentionItem } from "../../editors/tiptap/mentionSuggestion";

type EditorShellProps = {
  projectId: string;
  module: EditorModuleKey;
};

export function EditorShell({ projectId, module }: EditorShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    project,
    truth,
    latestSnapshotId,
    loading,
    error,
    document,
    setDocument,
    save,
    saveState,
    saveError,
    hasUnsaved,
    locked,
    lock,
    unlock,
    refresh
  } = useTruthDocument(projectId);
  const moduleConfig = MODULE_CONFIG_MAP[module];
  const isRoleModule = module === "roles";
  const isClueModule = module === "clues";
  const moduleDocKey =
    isDocumentModuleKey(module) && !isRoleModule && !isClueModule && module !== "overview"
      ? (module as DocumentModuleKey)
      : null;
  const moduleDoc = useModuleDocument(projectId, moduleDocKey);
  const rolesCollection = useModuleCollection(projectId, "roles", "角色");
  const cluesCollection = useModuleCollection(projectId, "clues", "线索");
  const projectMeta = useProjectMeta(projectId, project, refresh);
  const { deriveRoles, reviewLogic } = useMockAiTasks();
  const [tab, setTab] = useState("ai");
  const [panelError, setPanelError] = useState<string | null>(null);
  const entryParam = searchParams.get("entry");

  const activeCollection = isRoleModule
    ? rolesCollection
    : isClueModule
      ? cluesCollection
      : null;

  const mentionItems = useMemo<MentionItem[]>(() => {
    const roles = rolesCollection.entries.map((entry) => ({
      id: entry.id,
      label: entry.name,
      entityType: "role" as const,
      description: "角色条目"
    }));
    const clues = cluesCollection.entries.map((entry) => ({
      id: entry.id,
      label: entry.name,
      entityType: "clue" as const,
      description: "线索条目"
    }));
    return [...roles, ...clues];
  }, [rolesCollection.entries, cluesCollection.entries]);

  useEffect(() => {
    if (!entryParam) return;
    if (isRoleModule) {
      rolesCollection.setActiveEntry(entryParam);
    }
    if (isClueModule) {
      cluesCollection.setActiveEntry(entryParam);
    }
  }, [entryParam, isRoleModule, isClueModule, rolesCollection, cluesCollection]);

  const overviewDocument = useMemo(
    () =>
      deserializeDocument(projectMeta.form.overviewDoc, {
        projectId,
        module: "overview"
      }),
    [projectMeta.form.overviewDoc, projectId]
  );

  const moduleLabel = useMemo(
    () => moduleConfig?.label || "概览",
    [moduleConfig]
  );

  const moduleHint = useMemo(() => {
    if (module === "truth") {
      return locked ? "真相已锁定，编辑区只读" : "编辑真相内容";
    }
    if (moduleConfig?.requiresTruthLocked && !locked) {
      return "请先锁定真相后再编辑派生模块";
    }
    return "模块内容";
  }, [module, moduleConfig, locked]);

  const activeSaveState =
    module === "truth"
      ? saveState
      : module === "overview"
        ? projectMeta.saveState
        : activeCollection
          ? activeCollection.saveState
          : moduleDoc.saveState;

  const saveLabel = useMemo(() => {
    switch (activeSaveState) {
      case "saving":
        return "保存中…";
      case "success":
        return "已保存";
      case "error":
        return "保存失败";
      default:
        return "保存";
    }
  }, [activeSaveState]);

  const handleBack = () => {
    router.push("/workspace");
  };

  const handleLock = async () => {
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
    setPanelError(null);
    try {
      await lock();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "锁定失败，请重试");
    }
  };

  const handleUnlock = async () => {
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
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
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
    if (!locked) return;
    setPanelError(null);
    deriveRoles.run();
  };

  const handleReviewLogic = () => {
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
    setPanelError(null);
    reviewLogic.run();
  };

  const handleMentionClick = (item: MentionItem) => {
    if (item.entityType === "role") {
      router.push(
        `/projects/${projectId}/editor/roles?entry=${encodeURIComponent(item.id)}`
      );
      return;
    }
    if (item.entityType === "clue") {
      router.push(
        `/projects/${projectId}/editor/clues?entry=${encodeURIComponent(item.id)}`
      );
    }
  };

  const handleEntrySelect = (entryId: string) => {
    if (!activeCollection) return;
    const nextPath = `/projects/${projectId}/editor/${module}?entry=${encodeURIComponent(
      entryId
    )}`;
    router.push(nextPath);
    activeCollection.setActiveEntry(entryId);
  };

  const handleNav = (next: EditorModuleKey) => {
    router.push(`/projects/${projectId}/editor/${next}`);
  };

  const canWrite = Boolean(user);
  const requiresLocked = moduleConfig?.requiresTruthLocked ?? false;
  const canEditModule = canWrite && (!requiresLocked || locked);
  const canEditTruth = canWrite && !locked;

  const activeLoading =
    module === "truth"
      ? loading
      : module === "overview"
        ? false
        : activeCollection
          ? activeCollection.loading
          : moduleDoc.loading;
  const activeError =
    module === "truth"
      ? error
      : module === "overview"
        ? null
        : activeCollection
          ? activeCollection.error
          : moduleDoc.error;
  const activeSaveError =
    module === "truth"
      ? saveError
      : module === "overview"
        ? projectMeta.saveError
        : activeCollection
          ? activeCollection.saveError
          : moduleDoc.saveError;
  const activeHasUnsaved =
    module === "truth"
      ? hasUnsaved
      : module === "overview"
        ? projectMeta.hasUnsaved
        : activeCollection
          ? activeCollection.hasUnsaved
          : moduleDoc.hasUnsaved;
  const handleSave =
    module === "truth"
      ? save
      : module === "overview"
        ? projectMeta.save
        : activeCollection
          ? activeCollection.save
          : moduleDoc.save;
  const saveDisabled =
    module === "truth" ? !canEditTruth : module === "overview" ? !canWrite : !canEditModule;

  const projectStatus = useMemo(() => {
    const meta = (project?.meta || {}) as Record<string, unknown>;
    const value = meta.status;
    if (value === "In Progress" || value === "Completed") return value;
    return "Draft";
  }, [project?.meta]);

  const projectStatusLabel = useMemo(() => {
    switch (projectStatus) {
      case "In Progress":
        return "进行中";
      case "Completed":
        return "已完成";
      default:
        return "草稿";
    }
  }, [projectStatus]);

  const projectStatusTone = useMemo(() => {
    switch (projectStatus) {
      case "In Progress":
        return "bg-indigo-500";
      case "Completed":
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  }, [projectStatus]);

  const truthStatusLabel = locked ? "真相：已锁定" : "真相：草稿";
  const truthStatusTone = locked ? "bg-indigo-500" : "bg-slate-400";

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-lg font-semibold">
              {project?.name || "未命名项目"}
            </span>
            <span className="text-muted">/</span>
            <span className="text-muted">{moduleLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs text-ink shadow-soft">
              <span className={`h-2 w-2 rounded-full ${projectStatusTone}`} />
              项目：{projectStatusLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs text-ink shadow-soft">
              <span className={`h-2 w-2 rounded-full ${truthStatusTone}`} />
              {locked ? "🔒" : null}
              {truthStatusLabel}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleBack}>
          返回 Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="glass-panel-strong h-fit p-4">
          <div className="text-xs text-muted">模块导航</div>
          <div className="mt-4 space-y-1">
            {MODULE_CONFIGS.map((item) => (
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
          {activeCollection ? (
            <EntryList
              title={`${moduleLabel}条目`}
              entries={activeCollection.entries}
              activeId={activeCollection.activeEntryId}
              canEdit={canEditModule}
              onSelect={handleEntrySelect}
              onCreate={activeCollection.createEntry}
              onRename={activeCollection.renameEntry}
              onDelete={activeCollection.removeEntry}
            />
          ) : null}
          <div className="mt-6 text-xs text-muted">
            项目：{project?.name || "加载中…"}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <div className="text-lg font-semibold">{moduleLabel}</div>
              <div className="text-xs text-muted">{moduleHint}</div>
            </div>
            <Button
              onClick={canWrite ? handleSave : undefined}
              loading={activeSaveState === "saving"}
              disabled={saveDisabled}
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
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {!canWrite ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  未登录状态下仅支持只读浏览，请先登录后编辑。
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/90 px-5 py-4 shadow-soft">
                  <div className="text-xs text-muted">项目类型</div>
                  <select
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                    value={projectMeta.form.genre}
                    onChange={(event) =>
                      projectMeta.updateField("genre", event.target.value)
                    }
                    disabled={!canWrite}
                  >
                    <option value="">请选择</option>
                    <option value="悬疑">悬疑</option>
                    <option value="推理">推理</option>
                    <option value="情感">情感</option>
                    <option value="恐怖">恐怖</option>
                    <option value="奇幻">奇幻</option>
                    <option value="科幻">科幻</option>
                    <option value="历史">历史</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="rounded-2xl bg-white/90 px-5 py-4 shadow-soft">
                  <div className="text-xs text-muted">人数</div>
                  <select
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                    value={projectMeta.form.players}
                    onChange={(event) =>
                      projectMeta.updateField("players", event.target.value)
                    }
                    disabled={!canWrite}
                  >
                    <option value="">请选择</option>
                    <option value="3-4 人">3-4 人</option>
                    <option value="4-6 人">4-6 人</option>
                    <option value="6-8 人">6-8 人</option>
                    <option value="8-10 人">8-10 人</option>
                    <option value="不限">不限</option>
                  </select>
                </div>
                <div className="rounded-2xl bg-white/90 px-5 py-4 shadow-soft">
                  <div className="text-xs text-muted">当前版本</div>
                  <div className="mt-3 text-lg font-semibold text-ink">
                    {projectMeta.form.version?.trim() ||
                      latestSnapshotId ||
                      "v0.1"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    最近更新：{project?.updatedAt || "-"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">剧本简介</div>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                    核心
                  </span>
                </div>
                <div className="relative">
                  <DocumentEditor
                    value={overviewDocument}
                    onChange={(nextDoc) =>
                      projectMeta.setForm((prev) => ({
                        ...prev,
                        overviewDoc: nextDoc.content
                      }))
                    }
                    readonly={!canWrite}
                    mentionItems={mentionItems}
                    onMentionClick={handleMentionClick}
                  />
                  {!overviewDocument.text?.trim() ? (
                    <div className="pointer-events-none absolute left-8 top-6 text-sm text-muted">
                      写下你的故事背景，这里是灵感的起点...
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end text-[11px] text-muted">
                <span>
                  CREATED: {project?.createdAt || "-"} | UPDATED:{" "}
                  {project?.updatedAt || "-"}
                </span>
              </div>
            </div>
          ) : module === "truth" ? (
            <div className="space-y-3">
              {saveError ? <ErrorBanner message={saveError} /> : null}
              {locked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相已锁定，编辑区为只读。解锁后可继续修改。
                </div>
              ) : null}
              {!canWrite ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  未登录状态下仅支持只读浏览，请先登录后编辑。
                </div>
              ) : null}
              <DocumentEditor
                value={document}
                onChange={setDocument}
                readonly={!canEditTruth}
                mentionItems={mentionItems}
                onMentionClick={handleMentionClick}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {requiresLocked && !locked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相尚未锁定，请锁定后再编辑该模块。
                </div>
              ) : null}
              {!canWrite ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  未登录状态下仅支持只读浏览，请先登录后编辑。
                </div>
              ) : null}
              <DocumentEditor
                value={
                  activeCollection ? activeCollection.document : moduleDoc.document
                }
                onChange={
                  activeCollection
                    ? activeCollection.setDocument
                    : moduleDoc.setDocument
                }
                readonly={!canEditModule}
                mentionItems={mentionItems}
                onMentionClick={handleMentionClick}
              />
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
