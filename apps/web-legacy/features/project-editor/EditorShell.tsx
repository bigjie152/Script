"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/common/Button";
import { ModuleMetaGrid } from "../../components/modules/ModuleMetaGrid";
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
import { getIssues, IssueItem } from "../../services/issueApi";
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
    lock,
    unlock,
    refresh
  } = useTruthDocument(projectId);
  const moduleConfig = MODULE_CONFIG_MAP[module];
  const isRoleModule = module === "roles";
  const isClueModule = module === "clues";
  const isTimelineModule = module === "timeline";
  const isDmModule = module === "dm";
  const isCollectionModule = isRoleModule || isClueModule || isTimelineModule || isDmModule;
  const moduleDocKey =
    isDocumentModuleKey(module) && !isCollectionModule && module !== "overview"
      ? (module as DocumentModuleKey)
      : null;
  const moduleDoc = useModuleDocument(projectId, moduleDocKey);
  const rolesCollection = useModuleCollection(projectId, "roles", "角色");
  const cluesCollection = useModuleCollection(projectId, "clues", "线索");
  const timelineCollection = useModuleCollection(projectId, "timeline", "时间线");
  const dmCollection = useModuleCollection(projectId, "dm", "章节");
  const projectMeta = useProjectMeta(projectId, project, refresh);
  const { reviewLogic } = useMockAiTasks();
  const [tab, setTab] = useState("ai");
  const [panelError, setPanelError] = useState<string | null>(null);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const entryParam = searchParams.get("entry");
  const dmEditorRef = useRef<HTMLDivElement | null>(null);
  const [issueList, setIssueList] = useState<IssueItem[]>([]);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryValue, setEditingEntryValue] = useState("");
  const [editingModuleKey, setEditingModuleKey] = useState<EditorModuleKey | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const collections = useMemo(
    () => ({
      roles: rolesCollection,
      clues: cluesCollection,
      timeline: timelineCollection,
      dm: dmCollection
    }),
    [rolesCollection, cluesCollection, timelineCollection, dmCollection]
  );

  const activeCollection = isCollectionModule
    ? collections[module as "roles" | "clues" | "timeline" | "dm"]
    : null;
  const collectionEntries = activeCollection?.entries ?? [];
  const activeEntry = activeCollection?.activeEntry ?? null;
  const activeEntryMeta = (activeEntry?.meta || {}) as Record<string, unknown>;
  const activeEntryData = (activeEntry?.data || {}) as Record<string, unknown>;
  const showCollectionOverview = isCollectionModule && !entryParam;

  const collectionOverviewLabel = useMemo(() => {
    if (!showCollectionOverview) return null;
    switch (module) {
      case "roles":
        return "角色概览";
      case "clues":
        return "线索库";
      case "timeline":
        return "时间线概览";
      case "dm":
        return "DM 手册概览";
      default:
        return null;
    }
  }, [module, showCollectionOverview]);

  const roleNameKey = useMemo(
    () =>
      rolesCollection.entries
        .map((entry) => `${entry.id}:${entry.name}`)
        .join("|"),
    [rolesCollection.entries]
  );
  const clueNameKey = useMemo(
    () =>
      cluesCollection.entries
        .map((entry) => `${entry.id}:${entry.name}`)
        .join("|"),
    [cluesCollection.entries]
  );
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
  }, [roleNameKey, clueNameKey]);

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        const data = await getIssues(projectId, latestSnapshotId ?? undefined);
        if (!alive) return;
        setIssueList(data.issues || []);
        setIssueError(null);
      } catch (err) {
        if (!alive) return;
        setIssueError(err instanceof Error ? err.message : "风险点获取失败");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, latestSnapshotId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("script-ai-editor-nav");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setExpandedModules(parsed);
    } catch {
      setExpandedModules({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("script-ai-editor-nav", JSON.stringify(expandedModules));
  }, [expandedModules]);

  useEffect(() => {
    setExpandedModules((prev) => ({ ...prev, [module]: true }));
  }, [module]);

  useEffect(() => {
    if (!editingEntryId) return;
    const raf = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [editingEntryId]);

  useEffect(() => {
    if (!editingModuleKey || editingModuleKey === module) return;
    setEditingEntryId(null);
    setEditingEntryValue("");
    setEditingModuleKey(null);
    setRenameError(null);
    setPendingDeleteEntryId(null);
  }, [module, editingModuleKey]);

  useEffect(() => {
    if (!entryParam) return;
    if (activeCollection?.activeEntryId === entryParam) return;
    if (isRoleModule) {
      rolesCollection.setActiveEntry(entryParam);
    }
    if (isClueModule) {
      cluesCollection.setActiveEntry(entryParam);
    }
    if (isTimelineModule) {
      timelineCollection.setActiveEntry(entryParam);
    }
    if (isDmModule) {
      dmCollection.setActiveEntry(entryParam);
    }
  }, [
    entryParam,
    isRoleModule,
    isClueModule,
    isTimelineModule,
    isDmModule,
    activeCollection?.activeEntryId,
    rolesCollection.setActiveEntry,
    cluesCollection.setActiveEntry,
    timelineCollection.setActiveEntry,
    dmCollection.setActiveEntry
  ]);

  const overviewDocument = useMemo(
    () =>
      deserializeDocument(projectMeta.form.overviewDoc, {
        projectId,
        module: "overview"
      }),
    [projectMeta.form.overviewDoc, projectId]
  );

  const moduleLabel = useMemo(
    () => collectionOverviewLabel || moduleConfig?.label || "概览",
    [collectionOverviewLabel, moduleConfig]
  );

  const truthStatus = truth?.status === "LOCKED" ? "LOCKED" : "DRAFT";
  const truthLocked = truthStatus === "LOCKED";

  const moduleHint = useMemo(() => {
    if (showCollectionOverview) {
      return "点击卡片进入编辑，或新增条目";
    }
    if (module === "truth") {
      return truthLocked ? "真相已锁定，编辑区只读" : "编辑真相内容";
    }
    if (moduleConfig?.requiresTruthLocked && !truthLocked) {
      return "请先锁定真相后再编辑派生模块";
    }
    return "模块内容";
  }, [module, moduleConfig, showCollectionOverview, truthLocked]);

  const parsePercent = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.min(100, Math.max(0, Math.round(value)));
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/%/g, "").trim();
      const num = Number(cleaned);
      if (Number.isFinite(num)) {
        return Math.min(100, Math.max(0, Math.round(num)));
      }
    }
    return 0;
  };

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
    setUnlockConfirmOpen(false);
    setPanelError(null);
    try {
      await lock();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "锁定失败，请重试");
    }
  };

  const handleUnlockRequest = () => {
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
    setPanelError(null);
    setUnlockConfirmOpen(true);
  };

  const handleUnlockConfirm = async () => {
    if (!canWrite) {
      setPanelError("请先登录后再操作");
      return;
    }
    setPanelError(null);
    try {
      await unlock();
      setUnlockConfirmOpen(false);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "解锁失败，请重试");
    }
  };

  const handleUnlockCancel = () => {
    setUnlockConfirmOpen(false);
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

  const toggleModule = (target: EditorModuleKey) => {
    setExpandedModules((prev) => ({
      ...prev,
      [target]: !prev[target]
    }));
  };

  const startRename = (targetModule: EditorModuleKey, entryId: string, name: string) => {
    setEditingEntryId(entryId);
    setEditingModuleKey(targetModule);
    setEditingEntryValue(name);
    setRenameError(null);
  };

  const cancelRename = () => {
    setEditingEntryId(null);
    setEditingModuleKey(null);
    setEditingEntryValue("");
    setRenameError(null);
    setPendingDeleteEntryId(null);
  };

  const commitRename = () => {
    if (!editingEntryId || !editingModuleKey) return;
    const collection = collections[editingModuleKey as keyof typeof collections];
    if (!collection) return;
    const nextName = editingEntryValue.trim();
    if (!nextName) {
      setRenameError("名称不能为空");
      return;
    }
    collection.renameEntry(editingEntryId, nextName);
    cancelRename();
  };

  const handleEntrySelect = (targetModule: EditorModuleKey, entryId: string) => {
    const collection = collections[targetModule as keyof typeof collections];
    if (!collection) return;
    const nextPath = `/projects/${projectId}/editor/${targetModule}?entry=${encodeURIComponent(
      entryId
    )}`;
    router.push(nextPath);
    collection.setActiveEntry(entryId);
    cancelRename();
  };

  const handleCreateEntry = (targetModule: EditorModuleKey) => {
    const collection = collections[targetModule as keyof typeof collections];
    if (!collection) return;
    const entryId = collection.createEntry();
    if (entryId) {
      const nextLabel = MODULE_CONFIG_MAP[targetModule]?.label || "条目";
      setExpandedModules((prev) => ({ ...prev, [targetModule]: true }));
      setEditingEntryId(entryId);
      setEditingModuleKey(targetModule);
      setEditingEntryValue(`${nextLabel} ${collection.entries.length + 1}`);
      setRenameError(null);
      router.push(
        `/projects/${projectId}/editor/${targetModule}?entry=${encodeURIComponent(
          entryId
        )}`
      );
      collection.setActiveEntry(entryId);
    }
  };

  const updateActiveMeta = (nextMeta: Record<string, unknown>) => {
    if (!activeCollection?.activeEntryId) return;
    activeCollection.updateMeta(activeCollection.activeEntryId, nextMeta);
  };

  const updateActiveData = (nextData: Record<string, unknown>) => {
    if (!activeCollection?.activeEntryId) return;
    activeCollection.updateData(activeCollection.activeEntryId, nextData);
  };

  const handleNav = (next: EditorModuleKey) => {
    cancelRename();
    router.push(`/projects/${projectId}/editor/${next}`);
  };

  const canWrite = Boolean(user);
  const requiresLocked = moduleConfig?.requiresTruthLocked ?? false;
  const canEditModule = canWrite && (!requiresLocked || truthLocked);
  const canEditTruth = canWrite && !truthLocked;
  const editorDebug = process.env.NEXT_PUBLIC_EDITOR_DEBUG === "true";

  useEffect(() => {
    if (!editorDebug) return;
    console.info("[editor] context", {
      module,
      entryId: activeEntry?.id ?? null,
      truthLocked,
      canEdit: module === "truth" ? canEditTruth : canEditModule
    });
  }, [editorDebug, module, activeEntry?.id, truthLocked, canEditModule, canEditTruth]);

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
    const direct = (project as { status?: string } | null)?.status;
    const value = direct || meta.status;
    if (value === "In Progress" || value === "Completed") return value;
    return "Draft";
  }, [project?.meta, project?.id]);

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

  const truthStatusLabel = truthLocked ? "真相：已锁定" : "真相：草稿";
  const truthStatusTone = truthLocked ? "bg-indigo-500" : "bg-slate-400";
  const sourceVersion = useMemo(() => {
    const version = projectMeta.form.version?.trim();
    if (version) return version;
    if (latestSnapshotId) return latestSnapshotId;
    return "v0.1";
  }, [projectMeta.form.version, latestSnapshotId]);

  const p0Issues = useMemo(() => {
    return issueList.filter((issue) => String(issue.severity).toUpperCase() === "P0");
  }, [issueList]);

  const collectText = (node: any): string => {
    if (!node) return "";
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map(collectText).join("");
    }
    return "";
  };

  const buildOutline = (content: Record<string, unknown> | undefined) => {
    if (!content || typeof content !== "object") return [];
    const root = content as { content?: any[] };
    const headings: { index: number; text: string; level: number }[] = [];
    let index = 0;
    (root.content || []).forEach((node) => {
      if (node?.type === "heading") {
        const level = node.attrs?.level ?? 2;
        const text = collectText(node) || "未命名标题";
        headings.push({ index, text, level });
        index += 1;
      }
    });
    return headings;
  };

  const collectMentions = (
    node: any,
    bucket: { id: string; entityType: "role" | "clue" }[]
  ) => {
    if (!node) return;
    if (node.type === "roleMention" || node.type === "clueMention") {
      const id = node.attrs?.id;
      if (id) {
        bucket.push({
          id,
          entityType: node.type === "roleMention" ? "role" : "clue"
        });
      }
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child: any) => collectMentions(child, bucket));
    }
  };

  const extractMentionLabels = (content: Record<string, unknown> | undefined) => {
    if (!content || typeof content !== "object") return [];
    const bucket: { id: string; entityType: "role" | "clue" }[] = [];
    collectMentions(content, bucket);
    const unique = new Map<string, { id: string; label: string; entityType: "role" | "clue" }>();
    bucket.forEach((item) => {
      const match = mentionItems.find((mention) => mention.id === item.id);
      if (match) {
        unique.set(`${item.entityType}-${item.id}`, {
          id: item.id,
          label: match.label,
          entityType: item.entityType
        });
      }
    });
    return Array.from(unique.values());
  };

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
              {truthLocked ? (
                <svg
                  aria-hidden
                  className="h-3 w-3 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              ) : null}
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
          <div className="mt-4 space-y-2">
            {MODULE_CONFIGS.map((item) => {
              const collection = collections[item.key as keyof typeof collections];
              const canEditEntry = canWrite && (!item.requiresTruthLocked || truthLocked);
              const isExpanded =
                item.key === module ? true : Boolean(expandedModules[item.key]);
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleNav(item.key)}
                      className={`flex-1 rounded-xl px-3 py-2 text-left text-sm transition ${
                        item.key === module
                          ? "bg-white text-ink shadow-soft"
                          : "text-muted hover:bg-white/50 hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </button>
                    {collection ? (
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/60 hover:text-ink"
                        onClick={() => toggleModule(item.key)}
                        aria-label={`${item.label} 展开/折叠`}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                    ) : null}
                  </div>
                  {collection ? (
                    isExpanded ? (
                      <div className="space-y-1 pl-4 text-sm">
                        {collection.entries.map((entry) => {
                          const isActive =
                            entry.id === collection.activeEntryId && item.key === module;
                          const isEditing =
                            editingEntryId === entry.id && editingModuleKey === item.key;
                          const isPendingDelete = pendingDeleteEntryId === entry.id;
                          return (
                            <div
                              key={entry.id}
                              className={`flex items-start justify-between gap-2 rounded-lg px-2 py-1 text-xs ${
                                isActive
                                  ? "bg-white text-ink shadow-soft"
                                  : "text-muted hover:bg-white/50 hover:text-ink"
                              }`}
                            >
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      ref={renameInputRef}
                                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-ink/40"
                                      value={editingEntryValue}
                                      onChange={(event) =>
                                        setEditingEntryValue(event.target.value)
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          commitRename();
                                        }
                                        if (event.key === "Escape") {
                                          event.preventDefault();
                                          cancelRename();
                                        }
                                      }}
                                      onBlur={() => {
                                        if (!editingEntryValue.trim()) {
                                          cancelRename();
                                          return;
                                        }
                                        commitRename();
                                      }}
                                    />
                                    {renameError ? (
                                      <div className="text-[10px] text-rose-500">
                                        {renameError}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => handleEntrySelect(item.key, entry.id)}
                                  >
                                    {entry.name}
                                  </button>
                                )}
                              </div>
                              {canEditEntry ? (
                                <div className="flex items-center gap-1 text-[10px] text-muted">
                                  {isPendingDelete ? (
                                    <>
                                      <button
                                        type="button"
                                        className="rounded px-1 text-rose-500 hover:text-rose-600"
                                        onClick={() => {
                                          collection.removeEntry(entry.id);
                                          setPendingDeleteEntryId(null);
                                        }}
                                      >
                                        确认
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded px-1 hover:text-ink"
                                        onClick={() => setPendingDeleteEntryId(null)}
                                      >
                                        取消
                                      </button>
                                    </>
                                  ) : isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="rounded px-1 hover:text-ink"
                                        onClick={commitRename}
                                      >
                                        保存
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded px-1 hover:text-ink"
                                        onClick={cancelRename}
                                      >
                                        取消
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="rounded px-1 hover:text-ink"
                                        onClick={() =>
                                          startRename(item.key, entry.id, entry.name)
                                        }
                                      >
                                        重命名
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded px-1 hover:text-ink"
                                        onClick={() => setPendingDeleteEntryId(entry.id)}
                                        disabled={collection.entries.length <= 1}
                                      >
                                        删除
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {canEditEntry ? (
                          <button
                            type="button"
                            className="mt-1 flex items-center gap-2 text-xs text-muted hover:text-ink"
                            onClick={() => handleCreateEntry(item.key)}
                          >
                            + 添加{item.label}
                          </button>
                        ) : null}
                      </div>
                    ) : null
                  ) : null}
                </div>
              );
            })}
          </div>
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
              <ModuleMetaGrid
                cards={[
                  {
                    key: "genre",
                    title: "项目类型",
                    content: (
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
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
                    )
                  },
                  {
                    key: "players",
                    title: "人数",
                    content: (
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
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
                    )
                  },
                  {
                    key: "version",
                    title: "当前版本",
                    content: (
                      <div>
                        <div className="text-lg font-semibold text-ink">
                          {sourceVersion}
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          最近更新：{project?.updatedAt || "-"}
                        </div>
                      </div>
                    )
                  }
                ]}
              />

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
            <div className="space-y-4">
              <ModuleMetaGrid
                cards={[
                  {
                    key: "snapshot",
                    title: "最新快照",
                    content: (
                      <div>
                        <div className="text-base font-semibold text-ink">
                          {latestSnapshotId || sourceVersion}
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          {latestSnapshotId ? "快照已生成" : "默认版本"}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: "coverage",
                    title: "派生覆盖率",
                    content: (
                      <div className="text-sm text-muted">
                        即将上线
                      </div>
                    )
                  },
                  {
                    key: "lockedAt",
                    title: "锁定时间",
                    content: (
                      <div className="text-sm text-ink">
                        {truthLocked ? truth?.updatedAt || "已锁定" : "未锁定"}
                      </div>
                    )
                  }
                ]}
              />
              {saveError ? <ErrorBanner message={saveError} /> : null}
              {truthLocked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相已锁定，编辑区为只读。解锁后可继续修改。
                </div>
              ) : null}
              {!canWrite ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  未登录状态下仅支持只读浏览，请先登录后编辑。
                </div>
              ) : null}
              <div
                className={`rounded-2xl border px-4 py-4 ${
                  truthLocked
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-100 bg-white/90"
                }`}
              >
                {truthLocked ? (
                  <div className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                    内容已锁定，作为派生源
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
            </div>
          ) : module === "roles" || module === "clues" ? (
            showCollectionOverview ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">
                  {module === "roles" ? "角色概览" : "线索库"}
                </div>
                {module === "roles" ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {collectionEntries.map((entry) => {
                      const meta = (entry.meta || {}) as Record<string, unknown>;
                      const progress = parsePercent(meta.truthProgress);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-200"
                          onClick={() => handleEntrySelect("roles", entry.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-600">
                              {entry.name?.slice(0, 1) || "角"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-ink">
                                {entry.name}
                              </div>
                              <div className="text-xs text-muted">
                                {(meta.motivation as string) || "暂无标签"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="text-xs text-muted">剧本进度</div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                              <div
                                className="h-2 rounded-full bg-indigo-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-muted">
                              {progress}%
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {canEditModule ? (
                      <button
                        type="button"
                        className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-sm text-muted hover:border-indigo-200 hover:text-ink"
                        onClick={() => handleCreateEntry("roles")}
                      >
                        <div className="text-2xl">+</div>
                        创建新角色
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collectionEntries.map((entry) => {
                      const meta = (entry.meta || {}) as Record<string, unknown>;
                      const direction =
                        (meta.direction as string) || "指向未填写";
                      const authenticity =
                        (meta.authenticity as string) || "未知";
                      const difficulty = (meta.difficulty as string) || "";
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-200"
                          onClick={() => handleEntrySelect("clues", entry.id)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-muted">
                              线索
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-ink">
                                {entry.name}
                              </div>
                              <div className="text-xs text-muted">
                                {direction}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted">
                            {difficulty ? <span>{difficulty}</span> : null}
                            <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">
                              {authenticity}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {canEditModule ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 py-4 text-sm text-muted hover:border-indigo-200 hover:text-ink"
                        onClick={() => handleCreateEntry("clues")}
                      >
                        + 添加新线索
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {requiresLocked && !truthLocked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相尚未锁定，请锁定后再编辑该模块。
                </div>
              ) : null}
              {!canWrite ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  未登录状态下仅支持只读浏览，请先登录后编辑。
                </div>
              ) : null}
              <ModuleMetaGrid
                cards={
                  module === "roles"
                    ? [
                        {
                          key: "motivation",
                          title: "核心动机",
                          content: (
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.motivation as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  motivation: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                              placeholder="例如：复仇/赎罪"
                            />
                          )
                        },
                        {
                          key: "progress",
                          title: "已知真相进度",
                          content: (
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.truthProgress as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  truthProgress: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                              placeholder="例如：40%"
                            />
                          )
                        },
                        {
                          key: "secrets",
                          title: "秘密数量",
                          content: (
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.secretCount as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  secretCount: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                              placeholder="例如：3 个"
                            />
                          )
                        }
                      ]
                    : [
                        {
                          key: "direction",
                          title: "指向性",
                          content: (
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.direction as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  direction: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                              placeholder="例如：指向角色/场景"
                            />
                          )
                        },
                        {
                          key: "difficulty",
                          title: "获取难度",
                          content: (
                            <select
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.difficulty as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  difficulty: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                            >
                              <option value="">请选择</option>
                              <option value="★">★</option>
                              <option value="★★">★★</option>
                              <option value="★★★">★★★</option>
                              <option value="★★★★">★★★★</option>
                              <option value="★★★★★">★★★★★</option>
                            </select>
                          )
                        },
                        {
                          key: "authenticity",
                          title: "真实度",
                          content: (
                            <select
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                              value={(activeEntryMeta.authenticity as string) || ""}
                              onChange={(event) =>
                                updateActiveMeta({
                                  ...activeEntryMeta,
                                  authenticity: event.target.value
                                })
                              }
                              disabled={!canEditModule}
                            >
                              <option value="">请选择</option>
                              <option value="真实">真实</option>
                              <option value="虚假">虚假</option>
                              <option value="不确定">不确定</option>
                            </select>
                          )
                        }
                      ]
                }
              />
              {activeEntry ? (
                <div className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {activeEntry.name}
                    </div>
                    <div className="text-xs text-muted">Source: {sourceVersion}</div>
                  </div>
                  <DocumentEditor
                    value={activeCollection?.document || moduleDoc.document}
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
              ) : (
                <EmptyState title="暂无条目" description="请先创建条目后编辑内容" />
              )}
            </div>
            )
          ) : module === "timeline" ? (
            showCollectionOverview ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">时间线概览</div>
                <div className="space-y-3">
                  {collectionEntries.map((entry) => {
                    const data = (entry.data || {}) as Record<string, unknown>;
                    const events = Array.isArray(data.events) ? data.events.length : 0;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-200"
                        onClick={() => handleEntrySelect("timeline", entry.id)}
                      >
                        <div>
                          <div className="text-sm font-semibold text-ink">
                            {entry.name}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {events} 个事件
                          </div>
                        </div>
                        <div className="text-xs text-muted">进入编辑</div>
                      </button>
                    );
                  })}
                  {canEditModule ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 py-4 text-sm text-muted hover:border-indigo-200 hover:text-ink"
                      onClick={() => handleCreateEntry("timeline")}
                    >
                      + 添加时间线
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {requiresLocked && !truthLocked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相尚未锁定，请锁定后再编辑该模块。
                </div>
              ) : null}
              <ModuleMetaGrid
                cards={[
                  {
                    key: "duration",
                    title: "总时长",
                    content: (
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                        value={(activeEntryMeta.duration as string) || ""}
                        onChange={(event) =>
                          updateActiveMeta({
                            ...activeEntryMeta,
                            duration: event.target.value
                          })
                        }
                        disabled={!canEditModule}
                        placeholder="例如：4.5 小时"
                      />
                    )
                  },
                  {
                    key: "density",
                    title: "事件密度",
                    content: (
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                        value={(activeEntryMeta.density as string) || ""}
                        onChange={(event) =>
                          updateActiveMeta({
                            ...activeEntryMeta,
                            density: event.target.value
                          })
                        }
                        disabled={!canEditModule}
                        placeholder="例如：15 min/node"
                      />
                    )
                  },
                  {
                    key: "twists",
                    title: "关键反转",
                    content: (
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                        value={(activeEntryMeta.twists as string) || ""}
                        onChange={(event) =>
                          updateActiveMeta({
                            ...activeEntryMeta,
                            twists: event.target.value
                          })
                        }
                        disabled={!canEditModule}
                        placeholder="例如：3 次"
                      />
                    )
                  }
                ]}
              />
              {activeEntry ? (
                <div className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {activeEntry.name}
                    </div>
                    <Button
                      onClick={() => {
                        const events = Array.isArray(activeEntryData.events)
                          ? [...activeEntryData.events]
                          : [];
                        events.push({
                          id: crypto.randomUUID(),
                          time: "",
                          content: { type: "doc", content: [] }
                        });
                        updateActiveData({ ...activeEntryData, events });
                      }}
                      disabled={!canEditModule}
                      className="px-3 py-1 text-xs"
                    >
                      添加事件
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {(Array.isArray(activeEntryData.events)
                      ? activeEntryData.events
                      : []
                    ).map((event: any, index: number) => {
                      const eventDoc = deserializeDocument(event.content, {
                        projectId,
                        module: "timeline"
                      });
                      const participants = extractMentionLabels(event.content);
                      return (
                        <div
                          key={event.id || index}
                          className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
                        >
                          <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_160px]">
                            <div>
                              <div className="text-xs text-muted">时间点</div>
                              <input
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-ink/40"
                                value={event.time || ""}
                                onChange={(eventInput) => {
                                  const events = Array.isArray(activeEntryData.events)
                                    ? [...activeEntryData.events]
                                    : [];
                                  events[index] = { ...event, time: eventInput.target.value };
                                  updateActiveData({ ...activeEntryData, events });
                                }}
                                disabled={!canEditModule}
                                placeholder="例如 18:00"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted">事件详情</div>
                              <div className="mt-2">
                                <DocumentEditor
                                  value={eventDoc}
                                  onChange={(nextDoc) => {
                                    const events = Array.isArray(activeEntryData.events)
                                      ? [...activeEntryData.events]
                                      : [];
                                    events[index] = {
                                      ...event,
                                      content: nextDoc.content
                                    };
                                    updateActiveData({ ...activeEntryData, events });
                                  }}
                                  readonly={!canEditModule}
                                  mentionItems={mentionItems}
                                  onMentionClick={handleMentionClick}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted">涉及角色</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                                {participants.length ? (
                                  participants.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600"
                                      onClick={() =>
                                        handleMentionClick({
                                          id: item.id,
                                          label: item.label,
                                          entityType: item.entityType
                                        })
                                      }
                                    >
                                      @{item.label}
                                    </button>
                                  ))
                                ) : (
                                  <span>暂无关联</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(Array.isArray(activeEntryData.events)
                      ? activeEntryData.events
                      : []
                    ).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-xs text-muted">
                        点击右上角“添加事件”创建时间线节点。
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <EmptyState title="暂无时间线" description="请先创建时间线条目" />
              )}
            </div>
            )
          ) : module === "dm" ? (
            showCollectionOverview ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">DM 手册概览</div>
                <div className="space-y-3">
                  {collectionEntries.map((entry) => {
                    const meta = (entry.meta || {}) as Record<string, unknown>;
                    const difficulty = (meta.difficulty as string) || "未设置";
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-indigo-200"
                        onClick={() => handleEntrySelect("dm", entry.id)}
                      >
                        <div>
                          <div className="text-sm font-semibold text-ink">
                            {entry.name}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            难度：{difficulty}
                          </div>
                        </div>
                        <div className="text-xs text-muted">进入编辑</div>
                      </button>
                    );
                  })}
                  {canEditModule ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 py-4 text-sm text-muted hover:border-indigo-200 hover:text-ink"
                      onClick={() => handleCreateEntry("dm")}
                    >
                      + 添加 DM 章节
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {requiresLocked && !truthLocked ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
                  当前真相尚未锁定，请锁定后再编辑该模块。
                </div>
              ) : null}
              <ModuleMetaGrid
                cards={[
                  {
                    key: "difficulty",
                    title: "难度",
                    content: (
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                        value={(activeEntryMeta.difficulty as string) || ""}
                        onChange={(event) =>
                          updateActiveMeta({
                            ...activeEntryMeta,
                            difficulty: event.target.value
                          })
                        }
                        disabled={!canEditModule}
                      >
                        <option value="">请选择</option>
                        <option value="初级">初级</option>
                        <option value="进阶">进阶</option>
                        <option value="困难">困难</option>
                      </select>
                    )
                  },
                  {
                    key: "players",
                    title: "人数限制",
                    content: (
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
                        value={(activeEntryMeta.playersLimit as string) || ""}
                        onChange={(event) =>
                          updateActiveMeta({
                            ...activeEntryMeta,
                            playersLimit: event.target.value
                          })
                        }
                        disabled={!canEditModule}
                        placeholder="例如：5 人固定"
                      />
                    )
                  },
                  {
                    key: "risk",
                    title: "核心难点",
                    content: (
                      <div>
                        <div className="text-lg font-semibold text-ink">
                          {p0Issues.length} 个风险点
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          {issueError ? "获取失败" : "来自问题列表 P0"}
                        </div>
                      </div>
                    )
                  }
                ]}
              />
              {activeEntry ? (
                <div className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {activeEntry.name}
                    </div>
                    <div className="text-xs text-muted">Source: {sourceVersion}</div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div ref={dmEditorRef}>
                      <DocumentEditor
                        value={activeCollection?.document || moduleDoc.document}
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
                    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 text-sm">
                      <div className="text-sm font-semibold">本章大纲</div>
                      <div className="mt-3 space-y-2 text-xs text-muted">
                        {buildOutline(activeCollection?.document.content).length ? (
                          buildOutline(activeCollection?.document.content).map((item) => (
                            <button
                              key={item.index}
                              type="button"
                              className="block w-full text-left hover:text-ink"
                              onClick={() => {
                                const container = dmEditorRef.current;
                                if (!container) return;
                                const headings = container.querySelectorAll("h1, h2, h3");
                                const target = headings[item.index];
                                if (target) {
                                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }}
                            >
                              {item.text}
                            </button>
                          ))
                        ) : (
                          <div className="text-muted">暂无标题</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-muted">
                    <div className="flex items-center justify-between">
                      <span>风险提示（P0）</span>
                      <span>{p0Issues.length} 条</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px]">
                      {p0Issues.length ? (
                        p0Issues.slice(0, 3).map((issue) => (
                          <div key={issue.id} className="text-ink">
                            {issue.title}
                          </div>
                        ))
                      ) : (
                        <div>暂无风险点</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState title="暂无章节" description="请先创建 DM 手册章节" />
              )}
            </div>
            )
          ) : (
            <div className="space-y-3">
              {activeSaveError ? <ErrorBanner message={activeSaveError} /> : null}
              {requiresLocked && !truthLocked ? (
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
                value={moduleDoc.document}
                onChange={moduleDoc.setDocument}
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
                locked={truthLocked}
                onLock={handleLock}
                onUnlock={handleUnlockRequest}
                unlockConfirmOpen={unlockConfirmOpen}
                onUnlockConfirm={handleUnlockConfirm}
                onUnlockCancel={handleUnlockCancel}
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
