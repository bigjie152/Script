"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Sidebar, { NavStructure } from "./components/Sidebar";
import Header from "./components/Header";
import RightPanel from "./components/RightPanel";
import AiDraftOverlay, { AiDraftMode } from "./components/AiDraftOverlay";
import Overview from "./components/Modules/Overview";
import Truth from "./components/Modules/Truth";
import Story from "./components/Modules/Story";
import Roles from "./components/Modules/Roles";
import Clues from "./components/Modules/Clues";
import Timeline from "./components/Modules/Timeline";
import Manual from "./components/Modules/Manual";
import { resolveModuleKey, MODULE_CONFIG_MAP } from "@/modules/modules.config";
import { EditorModuleKey, EditorDocument } from "@/types/editorDocument";
import { useTruthDocument } from "@/hooks/useTruthDocument";
import { useModuleDocument } from "@/hooks/useModuleDocument";
import { useModuleCollection } from "@/hooks/useModuleCollection";
import { useProjectMeta } from "@/hooks/useProjectMeta";
import { MentionItem } from "@/editors/tiptap/mentionSuggestion";
import { normalizeContent, updateDocumentContent } from "@/editors/adapters/plainTextAdapter";
import { getStructureStatus, StructureStatusResponse } from "@/services/projectApi";
import { deriveDirectContent } from "@/services/aiApi";

type SaveState = "idle" | "saving" | "success" | "error";

type RouteParams = {
  projectId?: string;
  module?: string;
};

type AiDraftBackup =
  | {
      kind: "document";
      module: EditorModuleKey;
      document: EditorDocument;
    }
  | {
      kind: "collection";
      module: EditorModuleKey;
      snapshot: {
        kind: "collection";
        entries: Array<Record<string, unknown>>;
        activeId?: string | null;
      };
    };

const AI_ACTION_BY_MODULE: Record<EditorModuleKey, string | null> = {
  overview: null,
  truth: "outline",
  story: "story",
  roles: "role",
  clues: "clue",
  timeline: "timeline",
  dm: "dm"
};

const TARGET_MODULE_MAP: Record<string, EditorModuleKey> = {
  insight: "truth",
  outline: "truth",
  worldcheck: "truth",
  story: "story",
  role: "roles",
  clue: "clues",
  timeline: "timeline",
  dm: "dm"
};

const EditorApp: React.FC = () => {
  const params = useParams<RouteParams>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";
  const moduleKey = resolveModuleKey(
    typeof params.module === "string" ? params.module : null
  );
  const entryId = searchParams.get("entry") ?? undefined;

  const truthState = useTruthDocument(projectId);
  const overviewDoc = useModuleDocument(
    projectId,
    moduleKey === "overview" ? "overview" : null
  );
  const storyDoc = useModuleDocument(projectId, "story");
  const projectMeta = useProjectMeta(
    projectId,
    truthState.project,
    truthState.refresh
  );

  const roles = useModuleCollection(projectId, "roles", "ɫ");
  const clues = useModuleCollection(projectId, "clues", "");
  const timeline = useModuleCollection(projectId, "timeline", "ʱ");
  const manual = useModuleCollection(projectId, "dm", "DM ֲ");
  const [structureStatus, setStructureStatus] = useState<StructureStatusResponse | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [structureVersion, setStructureVersion] = useState(0);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLastPrompt, setAiLastPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AiDraftMode>("append");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDraftActive, setAiDraftActive] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<{
    module: EditorModuleKey;
    entryId?: string | null;
    actionType: string;
  } | null>(null);
  const [aiBackup, setAiBackup] = useState<AiDraftBackup | null>(null);

  const mentionItems = useMemo<MentionItem[]>(
    () => [
      ...roles.entries.map((entry) => ({
        id: entry.id,
        label: entry.name,
        entityType: "role" as const
      })),
      ...clues.entries.map((entry) => ({
        id: entry.id,
        label: entry.name,
        entityType: "clue" as const
      })),
      ...timeline.entries.map((entry) => ({
        id: entry.id,
        label: entry.name,
        entityType: "timeline" as const
      }))
    ],
    [roles.entries, clues.entries, timeline.entries]
  );

  const navStructure = useMemo<NavStructure>(
    () => ({
      roles: roles.entries.map((entry) => ({ id: entry.id, label: entry.name })),
      clues: clues.entries.map((entry) => ({ id: entry.id, label: entry.name })),
      timeline: timeline.entries.map((entry) => ({ id: entry.id, label: entry.name })),
      dm: manual.entries.map((entry) => ({ id: entry.id, label: entry.name }))
    }),
    [roles.entries, clues.entries, timeline.entries, manual.entries]
  );

  const currentEntryId = useMemo(() => {
    if (moduleKey === "roles") return entryId ?? roles.activeEntryId ?? null;
    if (moduleKey === "clues") return entryId ?? clues.activeEntryId ?? null;
    if (moduleKey === "timeline") return entryId ?? timeline.activeEntryId ?? null;
    if (moduleKey === "dm") return entryId ?? manual.activeEntryId ?? null;
    return null;
  }, [
    moduleKey,
    entryId,
    roles.activeEntryId,
    clues.activeEntryId,
    timeline.activeEntryId,
    manual.activeEntryId
  ]);

  const currentEntry = useMemo(() => {
    if (moduleKey === "roles") return roles.activeEntry ?? null;
    if (moduleKey === "clues") return clues.activeEntry ?? null;
    if (moduleKey === "timeline") return timeline.activeEntry ?? null;
    if (moduleKey === "dm") return manual.activeEntry ?? null;
    return null;
  }, [
    moduleKey,
    roles.activeEntry,
    clues.activeEntry,
    timeline.activeEntry,
    manual.activeEntry
  ]);

  useEffect(() => {
    if (!projectId || params.module) return;
    router.replace(`/projects/${projectId}/editor/overview`);
  }, [projectId, params.module, router]);

  useEffect(() => {
    if (!entryId) return;
    if (moduleKey === "roles") roles.setActiveEntry(entryId);
    if (moduleKey === "clues") clues.setActiveEntry(entryId);
    if (moduleKey === "timeline") timeline.setActiveEntry(entryId);
    if (moduleKey === "dm") manual.setActiveEntry(entryId);
  }, [
    entryId,
    moduleKey,
    roles.setActiveEntry,
    clues.setActiveEntry,
    timeline.setActiveEntry,
    manual.setActiveEntry
  ]);

  const projectStatusLabel = useMemo(() => {
    const raw = truthState.project?.status;
    if (raw) {
      const normalized = raw.toUpperCase();
      if (normalized === "TRUTH_LOCKED") return "真相已锁定";
      if (normalized === "PUBLISHED") return "已发布";
      if (normalized === "ARCHIVED") return "已归档";
      return "草稿阶段";
    }
    const status = projectMeta.form.status;
    if (status === "In Progress") return "进行中";
    if (status === "Completed") return "已完成";
    return "草稿阶段";
  }, [projectMeta.form.status, truthState.project?.status]);

  const isReadOnly =
    truthState.project?.status === "PUBLISHED" ||
    truthState.project?.status === "ARCHIVED";
  const readOnlyReason =
    truthState.project?.status === "PUBLISHED"
      ? "项目已发布"
      : truthState.project?.status === "ARCHIVED"
        ? "项目已归档"
        : "";

  const truthLocked = truthState.truth?.status === "LOCKED";
  const truthStatusLabel = truthLocked ? "已锁定" : "草稿中";

  const headerModuleLabel = MODULE_CONFIG_MAP[moduleKey]?.label ?? "";

  const combinedSaveState = useMemo<SaveState>(() => {
    if (moduleKey === "overview") {
      if (overviewDoc.saveState === "saving" || projectMeta.saveState === "saving")
        return "saving";
      if (overviewDoc.saveState === "error" || projectMeta.saveState === "error") return "error";
      if (overviewDoc.saveState === "success" || projectMeta.saveState === "success")
        return "success";
      return "idle";
    }
    if (moduleKey === "truth") return truthState.saveState;
    if (moduleKey === "story") return storyDoc.saveState;
    if (moduleKey === "roles") return roles.saveState;
    if (moduleKey === "clues") return clues.saveState;
    if (moduleKey === "timeline") return timeline.saveState;
    if (moduleKey === "dm") return manual.saveState;
    return "idle";
  }, [
    moduleKey,
    overviewDoc.saveState,
    projectMeta.saveState,
    storyDoc.saveState,
    truthState.saveState,
    roles.saveState,
    clues.saveState,
    timeline.saveState,
    manual.saveState
  ]);

  useEffect(() => {
    if (combinedSaveState !== "success") return;
    setStructureVersion((value) => value + 1);
  }, [combinedSaveState]);

  useEffect(() => {
    if (!aiNotice) return;
    const timer = window.setTimeout(() => setAiNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [aiNotice]);

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    async function run() {
      try {
        const result = await getStructureStatus(projectId);
        if (!alive) return;
        setStructureStatus(result);
        setStructureError(null);
      } catch (err) {
        if (!alive) return;
        setStructureError(err instanceof Error ? err.message : "ؽṹ״̬ʧ");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, structureVersion]);

  const aiActionType = AI_ACTION_BY_MODULE[moduleKey];
  const aiUiActive = aiTarget?.module === moduleKey;

  const aiDraftingHere = aiDraftActive && aiUiActive;

  const aiTriggerDisabledReason = useMemo(() => {
    if (!aiActionType) return "当前模块暂不支持 AI 生成";
    if (isReadOnly) return "项目处于只读状态";
    if (aiGenerating) return "AI 正在生成中";
    if (aiDraftActive) return "请先处理当前 AI 草稿";
    if (moduleKey === "truth" && truthLocked) return "Truth 已锁定，无法生成";
    if (moduleKey !== "truth" && !truthLocked) return "请先锁定 Truth";
    return null;
  }, [aiActionType, isReadOnly, aiGenerating, aiDraftActive, moduleKey, truthLocked]);

  const aiTriggerVisible =
    Boolean(aiActionType) && !(aiUiActive && (aiPromptOpen || aiDraftActive || aiGenerating));

  const buildAiContext = useCallback(() => {
    const summarize = (entries: Array<Record<string, unknown>>) =>
      entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        meta: entry.meta ?? null,
        placeholderId: (entry as Record<string, unknown>).placeholderId ?? entry.id
      }));

    const currentDoc =
      moduleKey === "truth"
        ? truthState.document.content
        : moduleKey === "story"
          ? storyDoc.document.content
          : moduleKey === "overview"
            ? overviewDoc.document.content
            : currentEntry?.content ?? { type: "doc", content: [] };

    return {
      current: {
        module: moduleKey,
        entryId: currentEntryId,
        meta: currentEntry?.meta ?? null,
        content: currentDoc
      },
      truth: truthState.document.content,
      story: storyDoc.document.content,
      overview: overviewDoc.document.content,
      roles: summarize(roles.entries as Array<Record<string, unknown>>),
      clues: summarize(clues.entries as Array<Record<string, unknown>>),
      timeline: summarize(timeline.entries as Array<Record<string, unknown>>),
      dm: summarize(manual.entries as Array<Record<string, unknown>>),
      structure: structureStatus
    };
  }, [
    moduleKey,
    currentEntryId,
    currentEntry,
    truthState.document.content,
    storyDoc.document.content,
    overviewDoc.document.content,
    roles.entries,
    clues.entries,
    timeline.entries,
    manual.entries,
    structureStatus
  ]);

  const restoreFromBackup = useCallback(
    (backup: AiDraftBackup | null) => {
      if (!backup) return;
      if (backup.kind === "document") {
        if (backup.module === "truth") {
          truthState.setDocument(backup.document);
        } else if (backup.module === "story") {
          storyDoc.setDocument(backup.document);
        } else if (backup.module === "overview") {
          overviewDoc.setDocument(backup.document);
        }
      } else {
        if (backup.module === "roles") roles.replaceCollection(backup.snapshot as any);
        if (backup.module === "clues") clues.replaceCollection(backup.snapshot as any);
        if (backup.module === "timeline") timeline.replaceCollection(backup.snapshot as any);
        if (backup.module === "dm") manual.replaceCollection(backup.snapshot as any);
      }
    },
    [truthState, storyDoc, overviewDoc, roles, clues, timeline, manual]
  );

  const enterAiDraft = useCallback(
    (
      items: Array<{ target: string; title: string; content?: Record<string, unknown> | null }>,
      mode: AiDraftMode
    ) => {
      if (!items.length) return null;
      const resolvedTarget = TARGET_MODULE_MAP[items[0].target] || moduleKey;

      if (resolvedTarget === "truth") {
        setAiBackup({
          kind: "document",
          module: "truth",
          document: JSON.parse(JSON.stringify(truthState.document)) as EditorDocument
        });
        const incomingDocs = items.map((item) => normalizeContent(item.content ?? {}));
        const baseDoc = normalizeContent(truthState.document.content);
        const merged =
          mode === "replace"
            ? {
                type: "doc",
                content: incomingDocs.flatMap((doc) => (doc as any).content || [])
              }
            : {
                type: "doc",
                content: [
                  ...((baseDoc as any).content || []),
                  ...incomingDocs.flatMap((doc) => (doc as any).content || [])
                ]
              };
        truthState.setDocument(updateDocumentContent(truthState.document, merged));
      }

      if (resolvedTarget === "story") {
        setAiBackup({
          kind: "document",
          module: "story",
          document: JSON.parse(JSON.stringify(storyDoc.document)) as EditorDocument
        });
        const incomingDocs = items.map((item) => normalizeContent(item.content ?? {}));
        const baseDoc = normalizeContent(storyDoc.document.content);
        const merged =
          mode === "replace"
            ? {
                type: "doc",
                content: incomingDocs.flatMap((doc) => (doc as any).content || [])
              }
            : {
                type: "doc",
                content: [
                  ...((baseDoc as any).content || []),
                  ...incomingDocs.flatMap((doc) => (doc as any).content || [])
                ]
              };
        storyDoc.setDocument(updateDocumentContent(storyDoc.document, merged));
      }

      if (resolvedTarget === "roles") {
        setAiBackup({
          kind: "collection",
          module: "roles",
          snapshot: roles.getSnapshot() as any
        });
        roles.applyEntries(
          items.map((item) => ({ title: item.title, content: item.content ?? {} })),
          mode
        );
      }

      if (resolvedTarget === "clues") {
        setAiBackup({
          kind: "collection",
          module: "clues",
          snapshot: clues.getSnapshot() as any
        });
        clues.applyEntries(
          items.map((item) => ({ title: item.title, content: item.content ?? {} })),
          mode
        );
      }

      if (resolvedTarget === "timeline") {
        setAiBackup({
          kind: "collection",
          module: "timeline",
          snapshot: timeline.getSnapshot() as any
        });
        timeline.applyEntries(
          items.map((item) => ({ title: item.title, content: item.content ?? {} })),
          mode
        );
      }

      if (resolvedTarget === "dm") {
        setAiBackup({
          kind: "collection",
          module: "dm",
          snapshot: manual.getSnapshot() as any
        });
        manual.applyEntries(
          items.map((item) => ({ title: item.title, content: item.content ?? {} })),
          mode
        );
      }

      const entryForTarget = resolvedTarget === moduleKey ? currentEntryId : null;
      setAiTarget({
        module: resolvedTarget,
        entryId: entryForTarget,
        actionType: aiActionType || "outline"
      });
      setAiDraftActive(true);
      setAiPromptOpen(false);
      setAiNotice(null);

      return { targetModule: resolvedTarget, itemCount: items.length };
    },
    [
      TARGET_MODULE_MAP,
      moduleKey,
      truthState,
      storyDoc,
      roles,
      clues,
      timeline,
      manual,
      currentEntryId,
      aiActionType
    ]
  );

  const handleAiTrigger = useCallback(() => {
    if (!aiActionType || aiTriggerDisabledReason) {
      if (aiTriggerDisabledReason) {
        setAiError(aiTriggerDisabledReason);
      }
      return;
    }
    if (aiDraftActive) {
      setAiError("请先处理当前 AI 草稿");
      return;
    }
    setAiTarget({ module: moduleKey, entryId: currentEntryId, actionType: aiActionType });
    setAiPromptOpen(true);
    setAiError(null);
    setAiNotice(null);
  }, [aiActionType, aiTriggerDisabledReason, aiDraftActive, moduleKey, currentEntryId]);

  const handleAiCancelPrompt = useCallback(() => {
    setAiPromptOpen(false);
    setAiError(null);
  }, []);

  const handleAiSubmit = useCallback(async () => {
    if (!projectId || !aiActionType) return;
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt) {
      setAiError("请输入提示词");
      return;
    }
    if (aiTriggerDisabledReason) {
      setAiError(aiTriggerDisabledReason);
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    setAiLastPrompt(trimmedPrompt);
    try {
      const result = await deriveDirectContent(projectId, {
        actionType: aiActionType,
        intent: trimmedPrompt,
        truthSnapshotId: truthState.latestSnapshotId ?? undefined,
        context: buildAiContext()
      });
      enterAiDraft(result.items || [], aiMode);
      setAiPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 生成失败，请稍后重试");
    } finally {
      setAiGenerating(false);
    }
  }, [
    projectId,
    aiActionType,
    aiPrompt,
    aiTriggerDisabledReason,
    truthState.latestSnapshotId,
    buildAiContext,
    enterAiDraft,
    aiMode
  ]);

  const handleAiAccept = useCallback(() => {
    setAiDraftActive(false);
    setAiBackup(null);
    setAiTarget(null);
    setAiNotice("AI 草稿已保留，请手动保存。");
  }, []);

  const handleAiDiscard = useCallback(() => {
    restoreFromBackup(aiBackup);
    setAiDraftActive(false);
    setAiBackup(null);
    setAiTarget(null);
    setAiPromptOpen(false);
    setAiError(null);
  }, [restoreFromBackup, aiBackup]);

  const handleAiRetry = useCallback(() => {
    restoreFromBackup(aiBackup);
    setAiDraftActive(false);
    setAiBackup(null);
    setAiError(null);
    setAiPrompt(aiLastPrompt);
    setAiPromptOpen(true);
  }, [restoreFromBackup, aiBackup, aiLastPrompt]);

  const aiOverlayNode = aiUiActive ? (
    <AiDraftOverlay
      promptOpen={aiPromptOpen}
      prompt={aiPrompt}
      mode={aiMode}
      isGenerating={aiGenerating}
      draftActive={aiDraftingHere}
      error={aiError}
      notice={aiNotice}
      onPromptChange={setAiPrompt}
      onPromptSubmit={handleAiSubmit}
      onPromptCancel={handleAiCancelPrompt}
      onModeChange={setAiMode}
      onAccept={handleAiAccept}
      onRetry={handleAiRetry}
      onDiscard={handleAiDiscard}
    />
  ) : null;

  const handleSave = useCallback(async () => {
    if (isReadOnly) return false;
    if (aiDraftActive && aiUiActive) {
      setAiNotice("请先采纳或放弃 AI 草稿，再保存。");
      return false;
    }
    if (moduleKey === "overview") {
      const results = await Promise.all([
        overviewDoc.hasUnsaved ? overviewDoc.save() : Promise.resolve(true),
        projectMeta.hasUnsaved ? projectMeta.save() : Promise.resolve(true)
      ]);
      return results.every(Boolean);
    }
    if (moduleKey === "truth") return truthState.save();
    if (moduleKey === "story") return storyDoc.save();
    if (moduleKey === "roles") return roles.save();
    if (moduleKey === "clues") return clues.save();
    if (moduleKey === "timeline") return timeline.save();
    if (moduleKey === "dm") return manual.save();
    return false;
  }, [
    isReadOnly,
    aiDraftActive,
    aiUiActive,
    moduleKey,
    overviewDoc,
    projectMeta,
    storyDoc,
    truthState,
    roles,
    clues,
    timeline,
    manual
  ]);

  const hasUnsaved = useMemo(() => {
    if (moduleKey === "overview") return overviewDoc.hasUnsaved || projectMeta.hasUnsaved;
    if (moduleKey === "truth") return truthState.hasUnsaved;
    if (moduleKey === "story") return storyDoc.hasUnsaved;
    if (moduleKey === "roles") return roles.hasUnsaved;
    if (moduleKey === "clues") return clues.hasUnsaved;
    if (moduleKey === "timeline") return timeline.hasUnsaved;
    if (moduleKey === "dm") return manual.hasUnsaved;
    return false;
  }, [
    moduleKey,
    overviewDoc.hasUnsaved,
    projectMeta.hasUnsaved,
    storyDoc.hasUnsaved,
    truthState.hasUnsaved,
    roles.hasUnsaved,
    clues.hasUnsaved,
    timeline.hasUnsaved,
    manual.hasUnsaved
  ]);

  const navigate = useCallback(
    async (module: EditorModuleKey, entry?: string) => {
      if (!projectId) return;
      if (aiGenerating) {
        window.alert("AI 正在生成，请稍后再切换模块。");
        return;
      }
      if (aiPromptOpen) {
        const ok = window.confirm("AI 指令尚未提交，确定要退出并关闭输入吗？");
        if (!ok) return;
        setAiPromptOpen(false);
        setAiError(null);
      }
      if (aiDraftActive) {
        const ok = window.confirm("AI 草稿尚未采纳，是否放弃并继续切换？");
        if (!ok) return;
        handleAiDiscard();
      }
      if (hasUnsaved && !isReadOnly) {
        const ok = await handleSave();
        if (!ok) {
          const force = window.confirm("保存失败，仍要切换模块吗？");
          if (!force) return;
        }
      }
      const base = `/projects/${projectId}/editor/${module}`;
      router.push(entry ? `${base}?entry=${entry}` : base);
    },
    [
      projectId,
      aiGenerating,
      aiPromptOpen,
      aiDraftActive,
      handleAiDiscard,
      hasUnsaved,
      isReadOnly,
      handleSave,
      router
    ]
  );



  const handleFixStructure = useCallback(() => {
    if (!structureStatus) return;
    const target = structureStatus.needsReviewModules[0] || structureStatus.missingModules[0];
    if (!target) return;
    navigate(resolveModuleKey(target));
  }, [structureStatus, navigate]);

  const applyAiContent = useCallback(
    async (payload: {
      target: string;
      items: Array<{ title: string; content?: Record<string, unknown> | null }>;
      mode: "append" | "replace";
    }) => {
      if (isReadOnly) {
        return { ok: false, message: readOnlyReason || "项目处于只读状态" };
      }
      if (aiDraftActive) {
        return { ok: false, message: "请先处理当前 AI 草稿" };
      }
      if (!payload.items.length) {
        return { ok: false, message: "AI 返回为空" };
      }

      const targetModule = TARGET_MODULE_MAP[payload.target] || moduleKey;
      if (targetModule === "truth" && truthLocked) {
        return { ok: false, message: "真相已锁定，无法生成" };
      }
      if (targetModule !== "truth" && !truthLocked) {
        return { ok: false, message: "请先锁定真相" };
      }

      const items = payload.items.map((item) => ({
        target: payload.target,
        title: item.title,
        content: item.content ?? {}
      }));

      const requiresTitle = ["roles", "clues", "timeline", "dm"].includes(targetModule);
      const filteredItems = requiresTitle
        ? items.filter((item) => item.title && item.title.trim().length > 0)
        : items;

      if (!filteredItems.length) {
        return { ok: false, message: "AI 返回为空" };
      }

      const result = enterAiDraft(filteredItems, payload.mode);
      if (!result) {
        return { ok: false, message: "AI 返回为空" };
      }

      const moduleLabelMap: Record<EditorModuleKey, string> = {
        overview: "概览",
        truth: "真相",
        story: "故事",
        roles: "角色",
        clues: "线索",
        timeline: "时间线",
        dm: "DM 手册"
      };
      const targetLabel = moduleLabelMap[result.targetModule] || "对应模块";
      const crossModuleNotice =
        result.targetModule !== moduleKey
          ? `已写入 ${targetLabel} 模块草稿，请切换后确认。`
          : "已写入当前模块草稿，请在下方确认。";
      const countHint = result.itemCount > 1 ? `共生成 ${result.itemCount} 条。` : "";

      return { ok: true, message: `${crossModuleNotice}${countHint}`.trim() };
    },
    [
      isReadOnly,
      readOnlyReason,
      aiDraftActive,
      moduleKey,
      truthLocked,
      enterAiDraft
    ]
  );

const createEntry = useCallback(
    (module: EditorModuleKey) => {
      if (!projectId) return null;
      let nextId: string | null = null;
      if (module === "roles") nextId = roles.createEntry();
      if (module === "clues") nextId = clues.createEntry();
      if (module === "timeline") nextId = timeline.createEntry();
      if (module === "dm") nextId = manual.createEntry();
      if (nextId) navigate(module, nextId);
      return nextId;
    },
    [projectId, roles, clues, timeline, manual, navigate]
  );

  const renameEntry = useCallback(
    async (module: EditorModuleKey, entryId: string, name: string) => {
      if (!projectId) return false;
      const target =
        module === "roles"
          ? roles
          : module === "clues"
            ? clues
            : module === "timeline"
              ? timeline
              : module === "dm"
                ? manual
                : null;
      if (!target) return false;
      target.renameEntry(entryId, name);
      const ok = await target.save();
      if (!ok) {
        target.refresh();
        return false;
      }
      return true;
    },
    [projectId, roles, clues, timeline, manual]
  );

  const deleteEntry = useCallback(
    async (module: EditorModuleKey, entryId: string) => {
      if (!projectId) return false;
      const target =
        module === "roles"
          ? roles
          : module === "clues"
            ? clues
            : module === "timeline"
              ? timeline
              : module === "dm"
                ? manual
                : null;
      if (!target) return false;
      target.removeEntry(entryId);
      const ok = await target.save();
      if (!ok) {
        target.refresh();
        return false;
      }
      const nextEntry = target.activeEntryId ?? undefined;
      navigate(module, nextEntry || undefined);
      return true;
    },
    [projectId, roles, clues, timeline, manual, navigate]
  );

  const handleMentionClick = useCallback(
    (item: MentionItem) => {
      if (item.entityType === "role") {
        navigate("roles", item.id);
        return;
      }
      if (item.entityType === "clue") {
        navigate("clues", item.id);
        return;
      }
      if (item.entityType === "timeline") {
        navigate("timeline", item.id);
      }
    },
    [navigate]
  );

  if (!projectId) {
    return <div className="p-6 text-sm text-gray-500">ĿڻЧ</div>;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      <Sidebar
        activeModule={moduleKey}
        activeEntryId={entryId}
        onNavigate={navigate}
        onCreateEntry={createEntry}
        onRenameEntry={renameEntry}
        onDeleteEntry={deleteEntry}
        structure={navStructure}
        structureStatus={structureStatus}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          moduleLabel={headerModuleLabel}
          projectTitle={truthState.project?.name || "δ籾"}
          projectStatusLabel={projectStatusLabel}
          truthStatusLabel={truthStatusLabel}
          truthLocked={truthLocked}
          readOnly={isReadOnly}
          readOnlyReason={readOnlyReason}
          saveState={combinedSaveState}
          onSave={handleSave}
          onBack={() => router.push("/workspace")}
          structureStatus={structureStatus}
          structureError={structureError}
          onFixStructure={handleFixStructure}
        />

        <main className="flex-1 overflow-y-auto px-6 py-5 md:px-7 md:py-6">
          {moduleKey === "overview" && (
            <Overview
              projectMeta={projectMeta}
              overviewDoc={overviewDoc}
              readOnly={isReadOnly}
              latestSnapshotId={truthState.latestSnapshotId}
              createdAt={truthState.project?.createdAt ?? null}
              updatedAt={truthState.project?.updatedAt ?? null}
            />
          )}
          {moduleKey === "truth" && (
            <Truth
              truthState={truthState}
              latestSnapshotId={truthState.latestSnapshotId}
              mentionItems={mentionItems}
              onMentionClick={handleMentionClick}
              readOnly={isReadOnly}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
          {moduleKey === "story" && (
            <Story
              document={storyDoc.document}
              setDocument={storyDoc.setDocument}
              readOnly={isReadOnly}
              mentionItems={mentionItems}
              onMentionClick={handleMentionClick}
              onOpenTruth={() => navigate("truth")}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
          {moduleKey === "roles" && (
            <Roles
              collection={roles}
              entryId={entryId}
              onSelectEntry={(id) => navigate("roles", id)}
              onCreateEntry={() => createEntry("roles")}
              onRenameEntry={(id, name) => renameEntry("roles", id, name)}
              readOnly={isReadOnly}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
          {moduleKey === "clues" && (
            <Clues
              collection={clues}
              entryId={entryId}
              onSelectEntry={(id) => navigate("clues", id)}
              onCreateEntry={() => createEntry("clues")}
              readOnly={isReadOnly}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
          {moduleKey === "timeline" && (
            <Timeline
              collection={timeline}
              entryId={entryId}
              onSelectEntry={(id) => navigate("timeline", id)}
              onCreateEntry={() => createEntry("timeline")}
              readOnly={isReadOnly}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
          {moduleKey === "dm" && (
            <Manual
              collection={manual}
              entryId={entryId}
              onSelectEntry={(id) => navigate("dm", id)}
              onCreateEntry={() => createEntry("dm")}
              readOnly={isReadOnly}
              aiTriggerVisible={aiTriggerVisible}
              aiTriggerDisabledReason={aiTriggerDisabledReason}
              onAiTrigger={handleAiTrigger}
              aiDraftActive={aiDraftingHere}
              aiOverlay={aiOverlayNode}
            />
          )}
        </main>
      </div>

      <RightPanel
        projectId={projectId}
        readOnly={isReadOnly}
        truthLocked={truthLocked}
        truthSnapshotId={truthState.latestSnapshotId ?? null}
        aiContext={buildAiContext()}
        onApplyAiContent={applyAiContent}
      />
    </div>
  );
};

export default EditorApp;
