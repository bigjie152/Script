"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Sidebar, { NavStructure } from "./components/Sidebar";
import Header from "./components/Header";
import RightPanel from "./components/RightPanel";
import Overview from "./components/Modules/Overview";
import Truth from "./components/Modules/Truth";
import Story from "./components/Modules/Story";
import Roles from "./components/Modules/Roles";
import Clues from "./components/Modules/Clues";
import Timeline from "./components/Modules/Timeline";
import Manual from "./components/Modules/Manual";
import AiCandidatePanel from "./components/AiCandidatePanel";
import { resolveModuleKey, MODULE_CONFIG_MAP } from "@/modules/modules.config";
import { EditorModuleKey } from "@/types/editorDocument";
import { useTruthDocument } from "@/hooks/useTruthDocument";
import { useModuleDocument } from "@/hooks/useModuleDocument";
import { useModuleCollection } from "@/hooks/useModuleCollection";
import { useProjectMeta } from "@/hooks/useProjectMeta";
import { MentionItem } from "@/editors/tiptap/mentionSuggestion";
import { getStructureStatus, StructureStatusResponse } from "@/services/projectApi";

type SaveState = "idle" | "saving" | "success" | "error";

type RouteParams = {
  projectId?: string;
  module?: string;
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
  const storyDoc = useModuleDocument(
    projectId,
    moduleKey === "story" ? "story" : null
  );
  const projectMeta = useProjectMeta(
    projectId,
    truthState.project,
    truthState.refresh
  );

  const roles = useModuleCollection(projectId, "roles", "角色");
  const clues = useModuleCollection(projectId, "clues", "线索");
  const timeline = useModuleCollection(projectId, "timeline", "时间线");
  const manual = useModuleCollection(projectId, "dm", "DM 手册");
  const [structureStatus, setStructureStatus] = useState<StructureStatusResponse | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [structureVersion, setStructureVersion] = useState(0);
  const [candidatesVersion, setCandidatesVersion] = useState(0);

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
      return "草稿";
    }
    const status = projectMeta.form.status;
    if (status === "In Progress") return "进行中";
    if (status === "Completed") return "已完成";
    return "草稿";
  }, [projectMeta.form.status, truthState.project?.status]);

  const isReadOnly =
    truthState.project?.status === "PUBLISHED" ||
    truthState.project?.status === "ARCHIVED";
  const readOnlyReason =
    truthState.project?.status === "PUBLISHED"
      ? "项目已发布，当前为只读"
      : truthState.project?.status === "ARCHIVED"
        ? "项目已归档，当前为只读"
        : "";

  const truthLocked = truthState.truth?.status === "LOCKED";
  const truthStatusLabel = truthLocked ? "已锁定" : "草稿";

  const headerModuleLabel = MODULE_CONFIG_MAP[moduleKey]?.label ?? "概览";

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
        setStructureError(err instanceof Error ? err.message : "加载结构状态失败");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, structureVersion]);

  const handleSave = useCallback(async () => {
    if (isReadOnly) return false;
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
      if (hasUnsaved && !isReadOnly) {
        const ok = await handleSave();
        if (!ok) {
          const force = window.confirm("保存失败，是否仍然切换？");
          if (!force) return;
        }
      }
      const base = `/projects/${projectId}/editor/${module}`;
      router.push(entry ? `${base}?entry=${entry}` : base);
    },
    [projectId, hasUnsaved, isReadOnly, handleSave, router]
  );

  const handleFixStructure = useCallback(() => {
    if (!structureStatus) return;
    const target = structureStatus.needsReviewModules[0] || structureStatus.missingModules[0];
    if (!target) return;
    navigate(resolveModuleKey(target));
  }, [structureStatus, navigate]);

  const handleCandidatesUpdated = useCallback(() => {
    setCandidatesVersion((value) => value + 1);
  }, []);

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
    return <div className="p-6 text-sm text-gray-500">项目不存在或链接无效。</div>;
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
          projectTitle={truthState.project?.name || "未命名剧本"}
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
            />
          )}
          {moduleKey === "clues" && (
            <Clues
              collection={clues}
              entryId={entryId}
              onSelectEntry={(id) => navigate("clues", id)}
              onCreateEntry={() => createEntry("clues")}
              readOnly={isReadOnly}
            />
          )}
          {moduleKey === "timeline" && (
            <Timeline
              collection={timeline}
              entryId={entryId}
              onSelectEntry={(id) => navigate("timeline", id)}
              onCreateEntry={() => createEntry("timeline")}
              readOnly={isReadOnly}
            />
          )}
          {moduleKey === "dm" && (
            <Manual
              collection={manual}
              entryId={entryId}
              onSelectEntry={(id) => navigate("dm", id)}
              onCreateEntry={() => createEntry("dm")}
              readOnly={isReadOnly}
            />
          )}

          {moduleKey !== "overview" && projectId ? (
            <AiCandidatePanel projectId={projectId} refreshKey={candidatesVersion} />
          ) : null}
        </main>
      </div>

      <RightPanel projectId={projectId} onCandidatesUpdated={handleCandidatesUpdated} />
    </div>
  );
};

export default EditorApp;
